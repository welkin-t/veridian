package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/nouvadev/veridian/backend/internal/auth"
)

// JWTAuthMiddleware creates a JWT authentication middleware
func JWTAuthMiddleware(jwtManager *auth.JWTManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header is required",
			})
			c.Abort()
			return
		}

		// Check if it starts with "Bearer "
		tokenParts := strings.SplitN(authHeader, " ", 2)
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" || strings.TrimSpace(tokenParts[1]) == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid authorization header format. Use: Bearer <token>",
			})
			c.Abort()
			return
		}

		tokenString := strings.TrimSpace(tokenParts[1])

		// Validate the token
		claims, err := jwtManager.ValidateAccessToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired token",
			})
			c.Abort()
			return
		}

		// Store user information in context
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("jwt_id", claims.JTI)

		c.Next()
	}
}

// GetUserIDFromContext extracts user ID from gin context
func GetUserIDFromContext(c *gin.Context) (uuid.UUID, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return uuid.Nil, false
	}

	id, ok := userID.(uuid.UUID)
	if !ok {
		return uuid.Nil, false
	}

	return id, true
}

// GetUserEmailFromContext extracts user email from gin context
func GetUserEmailFromContext(c *gin.Context) (string, bool) {
	email, exists := c.Get("user_email")
	if !exists {
		return "", false
	}

	emailStr, ok := email.(string)
	if !ok {
		return "", false
	}

	return emailStr, true
}

// RequireAuth is a helper that returns 401 if user is not authenticated
func RequireAuth(c *gin.Context) bool {
	userID, exists := GetUserIDFromContext(c)
	if !exists || userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
		})
		c.Abort()
		return false
	}
	return true
}
