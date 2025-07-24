package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"net/netip"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/nouvadev/veridian/backend/internal/app"
	"github.com/nouvadev/veridian/backend/internal/auth"
	"github.com/nouvadev/veridian/backend/internal/database"
	"github.com/nouvadev/veridian/backend/internal/middleware"
	"github.com/nouvadev/veridian/backend/internal/models"
)

// RegisterHandler handles POST /auth/register
func RegisterHandler(c *gin.Context, app *app.App) {
	var req models.RegisterRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request payload",
			"details": err.Error(),
		})
		return
	}

	// Validate password strength
	passwordManager := auth.NewPasswordManager()
	if err := passwordManager.ValidatePasswordStrength(req.Password); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	ctx := c.Request.Context()

	// Check if user already exists
	_, err := app.Queries.GetUserByEmailIncludeInactive(ctx, req.Email)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": "User with this email already exists",
		})
		return
	}

	// Hash the password
	hashedPassword, err := passwordManager.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to process password",
		})
		return
	}

	// Create user
	user, err := app.Queries.CreateUser(ctx, database.CreateUserParams{
		Email:          req.Email,
		HashedPassword: hashedPassword,
		EmailVerified:  false, // Will be verified later via email
		IsActive:       true,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create user",
		})
		return
	}

	// Generate tokens
	jwtManager := app.JWTManager
	accessToken, expiresAt, err := jwtManager.GenerateAccessToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate access token",
		})
		return
	}

	refreshToken, refreshExpiresAt, err := jwtManager.GenerateRefreshToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate refresh token",
		})
		return
	}

	// Store refresh token hash in database
	tokenHash := sha256.Sum256([]byte(refreshToken))
	tokenHashStr := hex.EncodeToString(tokenHash[:])

	userAgent := c.Request.UserAgent()
	_, err = app.Queries.CreateRefreshToken(ctx, database.CreateRefreshTokenParams{
		UserID:    user.ID,
		TokenHash: tokenHashStr,
		ExpiresAt: pgtype.Timestamptz{Time: refreshExpiresAt, Valid: true},
		UserAgent: &userAgent,
		IpAddress: parseIPToNetip(c.ClientIP()),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to store refresh token",
		})
		return
	}

	// Update last login
	app.Queries.UpdateUserLastLogin(ctx, user.ID)

	response := models.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    expiresAt,
		User: models.User{
			ID:            user.ID,
			Email:         user.Email,
			EmailVerified: user.EmailVerified,
			IsActive:      user.IsActive,
			CreatedAt:     user.CreatedAt,
			UpdatedAt:     user.UpdatedAt,
			LastLogin:     convertPgTimestamptz(user.LastLogin),
		},
	}

	c.JSON(http.StatusCreated, response)
}

// LoginHandler handles POST /auth/login
func LoginHandler(c *gin.Context, app *app.App) {
	var req models.LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request payload",
			"details": err.Error(),
		})
		return
	}

	ctx := c.Request.Context()

	// Get user by email
	user, err := app.Queries.GetUserByEmail(ctx, req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid email or password",
		})
		return
	}

	// Verify password
	passwordManager := auth.NewPasswordManager()
	isValid, err := passwordManager.VerifyPassword(req.Password, user.HashedPassword)
	if err != nil || !isValid {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid email or password",
		})
		return
	}

	// Generate tokens
	jwtManager := app.JWTManager
	accessToken, expiresAt, err := jwtManager.GenerateAccessToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate access token",
		})
		return
	}

	refreshToken, refreshExpiresAt, err := jwtManager.GenerateRefreshToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate refresh token",
		})
		return
	}

	// Store refresh token hash in database
	tokenHash := sha256.Sum256([]byte(refreshToken))
	tokenHashStr := hex.EncodeToString(tokenHash[:])

	userAgent := c.Request.UserAgent()
	_, err = app.Queries.CreateRefreshToken(ctx, database.CreateRefreshTokenParams{
		UserID:    user.ID,
		TokenHash: tokenHashStr,
		ExpiresAt: pgtype.Timestamptz{Time: refreshExpiresAt, Valid: true},
		UserAgent: &userAgent,
		IpAddress: parseIPToNetip(c.ClientIP()),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to store refresh token",
		})
		return
	}

	// Update last login
	app.Queries.UpdateUserLastLogin(ctx, user.ID)

	response := models.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    expiresAt,
		User: models.User{
			ID:            user.ID,
			Email:         user.Email,
			EmailVerified: user.EmailVerified,
			IsActive:      user.IsActive,
			CreatedAt:     user.CreatedAt,
			UpdatedAt:     user.UpdatedAt,
			LastLogin:     convertPgTimestamptz(user.LastLogin),
		},
	}

	c.JSON(http.StatusOK, response)
}

// RefreshTokenHandler handles POST /auth/refresh
func RefreshTokenHandler(c *gin.Context, app *app.App) {
	var req models.RefreshTokenRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request payload",
			"details": err.Error(),
		})
		return
	}

	ctx := c.Request.Context()

	// Validate refresh token
	jwtManager := app.JWTManager
	userID, err := jwtManager.ExtractUserIDFromRefreshToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid refresh token",
		})
		return
	}

	// Check if refresh token exists in database
	tokenHash := sha256.Sum256([]byte(req.RefreshToken))
	tokenHashStr := hex.EncodeToString(tokenHash[:])

	storedToken, err := app.Queries.GetRefreshToken(ctx, tokenHashStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid or expired refresh token",
		})
		return
	}

	// Get user details
	user, err := app.Queries.GetUserByID(ctx, userID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not found",
		})
		return
	}

	// Generate new access token
	accessToken, expiresAt, err := jwtManager.GenerateAccessToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate access token",
		})
		return
	}

	// Generate new refresh token (rotation)
	newRefreshToken, newRefreshExpiresAt, err := jwtManager.GenerateRefreshToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate refresh token",
		})
		return
	}

	// Revoke old refresh token
	app.Queries.RevokeRefreshToken(ctx, tokenHashStr)

	// Store new refresh token
	newTokenHash := sha256.Sum256([]byte(newRefreshToken))
	newTokenHashStr := hex.EncodeToString(newTokenHash[:])

	userAgent := c.Request.UserAgent()
	_, err = app.Queries.CreateRefreshToken(ctx, database.CreateRefreshTokenParams{
		UserID:    user.ID,
		TokenHash: newTokenHashStr,
		ExpiresAt: pgtype.Timestamptz{Time: newRefreshExpiresAt, Valid: true},
		UserAgent: &userAgent,
		IpAddress: parseIPToNetip(c.ClientIP()),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to store refresh token",
		})
		return
	}

	// Update last used timestamp for tracking
	app.Queries.UpdateRefreshTokenLastUsed(ctx, storedToken.ID)

	response := models.RefreshTokenResponse{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		ExpiresAt:    expiresAt,
	}

	c.JSON(http.StatusOK, response)
}

// LogoutHandler handles POST /auth/logout
func LogoutHandler(c *gin.Context, app *app.App) {
	var req models.RefreshTokenRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request payload",
			"details": err.Error(),
		})
		return
	}

	ctx := c.Request.Context()

	// Revoke the refresh token
	tokenHash := sha256.Sum256([]byte(req.RefreshToken))
	tokenHashStr := hex.EncodeToString(tokenHash[:])

	app.Queries.RevokeRefreshToken(ctx, tokenHashStr)

	c.JSON(http.StatusOK, gin.H{
		"message": "Logged out successfully",
	})
}

// GetProfileHandler handles GET /auth/profile
func GetProfileHandler(c *gin.Context, app *app.App) {
	if !middleware.RequireAuth(c) {
		return
	}

	userID, _ := middleware.GetUserIDFromContext(c)
	ctx := c.Request.Context()

	user, err := app.Queries.GetUserByID(ctx, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	response := models.User{
		ID:            user.ID,
		Email:         user.Email,
		EmailVerified: user.EmailVerified,
		IsActive:      user.IsActive,
		CreatedAt:     user.CreatedAt,
		UpdatedAt:     user.UpdatedAt,
		LastLogin:     convertPgTimestamptz(user.LastLogin),
	}

	c.JSON(http.StatusOK, response)
}

// ChangePasswordHandler handles POST /auth/change-password
func ChangePasswordHandler(c *gin.Context, app *app.App) {
	if !middleware.RequireAuth(c) {
		return
	}

	var req models.ChangePasswordRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request payload",
			"details": err.Error(),
		})
		return
	}

	userID, _ := middleware.GetUserIDFromContext(c)
	ctx := c.Request.Context()

	// Get current user
	user, err := app.Queries.GetUserByID(ctx, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	// Verify current password
	passwordManager := auth.NewPasswordManager()
	isValid, err := passwordManager.VerifyPassword(req.CurrentPassword, user.HashedPassword)
	if err != nil || !isValid {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Current password is incorrect",
		})
		return
	}

	// Validate new password strength
	if err := passwordManager.ValidatePasswordStrength(req.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Hash new password
	hashedPassword, err := passwordManager.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to process new password",
		})
		return
	}

	// Update password
	_, err = app.Queries.UpdateUserPassword(ctx, database.UpdateUserPasswordParams{
		ID:             userID,
		HashedPassword: hashedPassword,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update password",
		})
		return
	}

	// Revoke all existing refresh tokens for security
	app.Queries.RevokeAllUserRefreshTokens(ctx, userID)

	c.JSON(http.StatusOK, gin.H{
		"message": "Password changed successfully. Please log in again.",
	})
}

// Helper functions

// parseIPToNetip parses IP address string to netip.Addr pointer for database storage
func parseIPToNetip(ipStr string) *netip.Addr {
	if ipStr == "" {
		return nil
	}

	// Parse IPv4 first
	if ip, err := netip.ParseAddr(ipStr); err == nil {
		return &ip
	}

	return nil
}

// convertPgTimestamptz converts pgtype.Timestamptz to *time.Time
func convertPgTimestamptz(ts pgtype.Timestamptz) *time.Time {
	if !ts.Valid {
		return nil
	}
	return &ts.Time
}
