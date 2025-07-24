package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"

	"github.com/nouvadev/veridian/backend/internal/app"
	"github.com/nouvadev/veridian/backend/internal/auth"
	"github.com/nouvadev/veridian/backend/internal/models"
)

// AuthHandlerTestSuite defines the test suite for auth handlers
type AuthHandlerTestSuite struct {
	suite.Suite
	app        *app.App
	router     *gin.Engine
	jwtManager *auth.JWTManager
}

// SetupSuite runs once before all tests
func (suite *AuthHandlerTestSuite) SetupSuite() {
	gin.SetMode(gin.TestMode)

	// Create JWT manager for testing
	suite.jwtManager = auth.NewJWTManager(
		"test-secret-key-32-characters-long",
		"test-issuer",
		"test-audience",
		15*time.Minute,
		7*24*time.Hour,
	)

	// Create app with minimal setup for validation tests
	suite.app = &app.App{
		JWTManager: suite.jwtManager,
		// DB and Queries are nil - we'll only test validation logic
	}

	// Setup router
	suite.router = gin.New()
	suite.setupRoutes()
}

// SetupTest runs before each test
func (suite *AuthHandlerTestSuite) SetupTest() {
	// Reset any test state if needed
}

func (suite *AuthHandlerTestSuite) setupRoutes() {
	// Create password manager for validation
	passwordManager := auth.NewPasswordManager()

	// Setup validation-only routes that don't hit database
	authGroup := suite.router.Group("/auth")
	{
		// These routes will only test validation logic
		authGroup.POST("/register/validate", func(c *gin.Context) {
			var req models.RegisterRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "details": err.Error()})
				return
			}

			// Test password validation
			if err := passwordManager.ValidatePasswordStrength(req.Password); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{"message": "Validation passed"})
		})
		authGroup.POST("/login/validate", func(c *gin.Context) {
			var req models.LoginRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "details": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"message": "Validation passed"})
		})
		authGroup.POST("/refresh/validate", func(c *gin.Context) {
			var req struct {
				RefreshToken string `json:"refresh_token" binding:"required"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "details": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"message": "Validation passed"})
		})
	}
}

func (suite *AuthHandlerTestSuite) TestRegisterHandler_ValidRequest() {
	// Test payload validation and password strength
	testCases := []struct {
		name           string
		payload        models.RegisterRequest
		expectedStatus int
		expectedError  string
	}{
		{
			name: "Valid registration",
			payload: models.RegisterRequest{
				Email:    "test@example.com",
				Password: "ValidPass123!",
			},
			expectedStatus: http.StatusInternalServerError, // Will fail at DB level, but validation passes
		},
		{
			name: "Invalid email",
			payload: models.RegisterRequest{
				Email:    "invalid-email",
				Password: "ValidPass123!",
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Invalid request payload",
		},
		{
			name: "Weak password",
			payload: models.RegisterRequest{
				Email:    "test@example.com",
				Password: "weak",
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "at least 8 characters",
		},
		{
			name: "Password without uppercase",
			payload: models.RegisterRequest{
				Email:    "test@example.com",
				Password: "lowercase123!",
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "uppercase letter",
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			// Prepare request
			jsonPayload, err := json.Marshal(tc.payload)
			require.NoError(suite.T(), err)

			req := httptest.NewRequest("POST", "/auth/register", bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			// Execute
			suite.router.ServeHTTP(w, req)

			// Assert
			assert.Equal(suite.T(), tc.expectedStatus, w.Code)
			if tc.expectedError != "" {
				assert.Contains(suite.T(), w.Body.String(), tc.expectedError)
			}
		})
	}
}

func (suite *AuthHandlerTestSuite) TestLoginHandler_InvalidPayload() {
	testCases := []struct {
		name           string
		payload        interface{}
		expectedStatus int
		expectedError  string
	}{
		{
			name: "Missing email",
			payload: map[string]string{
				"password": "ValidPass123!",
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Invalid request payload",
		},
		{
			name: "Missing password",
			payload: map[string]string{
				"email": "test@example.com",
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Invalid request payload",
		},
		{
			name: "Invalid email format",
			payload: models.LoginRequest{
				Email:    "invalid-email",
				Password: "ValidPass123!",
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Invalid request payload",
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			// Prepare request
			jsonPayload, err := json.Marshal(tc.payload)
			require.NoError(suite.T(), err)

			req := httptest.NewRequest("POST", "/auth/login", bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			// Execute
			suite.router.ServeHTTP(w, req)

			// Assert
			assert.Equal(suite.T(), tc.expectedStatus, w.Code)
			assert.Contains(suite.T(), w.Body.String(), tc.expectedError)
		})
	}
}

func (suite *AuthHandlerTestSuite) TestRefreshTokenHandler_InvalidPayload() {
	testCases := []struct {
		name           string
		payload        interface{}
		expectedStatus int
		expectedError  string
	}{
		{
			name: "Missing refresh token",
			payload: map[string]string{
				"other_field": "value",
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Invalid request payload",
		},
		{
			name: "Empty refresh token",
			payload: models.RefreshTokenRequest{
				RefreshToken: "",
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Invalid request payload",
		},
		{
			name: "Invalid refresh token format",
			payload: models.RefreshTokenRequest{
				RefreshToken: "invalid-token",
			},
			expectedStatus: http.StatusUnauthorized,
			expectedError:  "Invalid refresh token",
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			// Prepare request
			jsonPayload, err := json.Marshal(tc.payload)
			require.NoError(suite.T(), err)

			req := httptest.NewRequest("POST", "/auth/refresh", bytes.NewBuffer(jsonPayload))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			// Execute
			suite.router.ServeHTTP(w, req)

			// Assert
			assert.Equal(suite.T(), tc.expectedStatus, w.Code)
			assert.Contains(suite.T(), w.Body.String(), tc.expectedError)
		})
	}
}

func (suite *AuthHandlerTestSuite) TestLogoutHandler_ValidRequest() {
	// Create a valid refresh token
	userID := uuid.New()
	refreshToken, _, err := suite.jwtManager.GenerateRefreshToken(userID)
	require.NoError(suite.T(), err)

	payload := models.RefreshTokenRequest{
		RefreshToken: refreshToken,
	}

	// Prepare request
	jsonPayload, err := json.Marshal(payload)
	require.NoError(suite.T(), err)

	req := httptest.NewRequest("POST", "/auth/logout", bytes.NewBuffer(jsonPayload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// Execute
	suite.router.ServeHTTP(w, req)

	// Assert - Will fail at DB level but payload validation passes
	// In a real test with DB, this would succeed
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	// Note: Without DB mock, we can't fully test the database operations
}

// TestHandlerValidation runs all handler validation tests
func TestHandlerValidation(t *testing.T) {
	suite.Run(t, new(AuthHandlerTestSuite))
}

// Unit test for password validation logic
func TestPasswordValidationLogic(t *testing.T) {
	passwordManager := auth.NewPasswordManager()

	testCases := []struct {
		name     string
		password string
		wantErr  bool
	}{
		{"Valid password", "ValidPass123!", false},
		{"Too short", "Short1!", true},
		{"No uppercase", "validpass123!", true},
		{"No lowercase", "VALIDPASS123!", true},
		{"No number", "ValidPass!", true},
		{"No special char", "ValidPass123", true},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			err := passwordManager.ValidatePasswordStrength(tc.password)
			if tc.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

// Unit test for JWT token generation and validation
func TestJWTTokenFlow(t *testing.T) {
	jwtManager := auth.NewJWTManager(
		"test-secret-key-32-characters-long",
		"test-issuer",
		"test-audience",
		15*time.Minute,
		7*24*time.Hour,
	)

	userID := uuid.New()
	email := "test@example.com"

	// Test access token flow
	t.Run("Access token flow", func(t *testing.T) {
		// Generate token
		token, expiresAt, err := jwtManager.GenerateAccessToken(userID, email)
		require.NoError(t, err)
		assert.NotEmpty(t, token)
		assert.True(t, expiresAt.After(time.Now()))

		// Validate token
		claims, err := jwtManager.ValidateAccessToken(token)
		require.NoError(t, err)
		assert.Equal(t, userID, claims.UserID)
		assert.Equal(t, email, claims.Email)
	})

	// Test refresh token flow
	t.Run("Refresh token flow", func(t *testing.T) {
		// Generate refresh token
		refreshToken, expiresAt, err := jwtManager.GenerateRefreshToken(userID)
		require.NoError(t, err)
		assert.NotEmpty(t, refreshToken)
		assert.True(t, expiresAt.After(time.Now().Add(6*24*time.Hour)))

		// Extract user ID
		extractedUserID, err := jwtManager.ExtractUserIDFromRefreshToken(refreshToken)
		require.NoError(t, err)
		assert.Equal(t, userID, extractedUserID)
	})
}
