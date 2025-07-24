package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/nouvadev/veridian/backend/internal/auth"
	"github.com/nouvadev/veridian/backend/internal/models"
)

func TestValidationEndpoints(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	passwordManager := auth.NewPasswordManager()

	// Setup validation endpoints
	authGroup := router.Group("/auth")
	{
		authGroup.POST("/register/validate", func(c *gin.Context) {
			var req models.RegisterRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "details": err.Error()})
				return
			}

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

	t.Run("Register validation", func(t *testing.T) {
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
				expectedStatus: http.StatusOK,
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
				name: "Weak password - too short",
				payload: models.RegisterRequest{
					Email:    "test@example.com",
					Password: "weak",
				},
				expectedStatus: http.StatusBadRequest,
				expectedError:  "Invalid request payload", // Check generic error
			},
			{
				name: "Password without uppercase",
				payload: models.RegisterRequest{
					Email:    "test@example.com",
					Password: "validpass123!",
				},
				expectedStatus: http.StatusBadRequest,
				expectedError:  "uppercase letter",
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				jsonPayload, err := json.Marshal(tc.payload)
				require.NoError(t, err)

				req, err := http.NewRequest("POST", "/auth/register/validate", bytes.NewBuffer(jsonPayload))
				require.NoError(t, err)
				req.Header.Set("Content-Type", "application/json")

				w := httptest.NewRecorder()
				router.ServeHTTP(w, req)

				assert.Equal(t, tc.expectedStatus, w.Code)

				if tc.expectedError != "" {
					var response map[string]interface{}
					err := json.Unmarshal(w.Body.Bytes(), &response)
					require.NoError(t, err)

					errorMsg, exists := response["error"]
					require.True(t, exists, "Expected error field in response")
					assert.Contains(t, errorMsg.(string), tc.expectedError)
				}
			})
		}
	})

	t.Run("Login validation", func(t *testing.T) {
		testCases := []struct {
			name           string
			payload        models.LoginRequest
			expectedStatus int
			expectedError  string
		}{
			{
				name: "Valid login",
				payload: models.LoginRequest{
					Email:    "test@example.com",
					Password: "password123",
				},
				expectedStatus: http.StatusOK,
			},
			{
				name: "Missing email",
				payload: models.LoginRequest{
					Password: "password123",
				},
				expectedStatus: http.StatusBadRequest,
				expectedError:  "Invalid request payload",
			},
			{
				name: "Missing password",
				payload: models.LoginRequest{
					Email: "test@example.com",
				},
				expectedStatus: http.StatusBadRequest,
				expectedError:  "Invalid request payload",
			},
			{
				name: "Invalid email format",
				payload: models.LoginRequest{
					Email:    "invalid-email",
					Password: "password123",
				},
				expectedStatus: http.StatusBadRequest,
				expectedError:  "Invalid request payload",
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				jsonPayload, err := json.Marshal(tc.payload)
				require.NoError(t, err)

				req, err := http.NewRequest("POST", "/auth/login/validate", bytes.NewBuffer(jsonPayload))
				require.NoError(t, err)
				req.Header.Set("Content-Type", "application/json")

				w := httptest.NewRecorder()
				router.ServeHTTP(w, req)

				assert.Equal(t, tc.expectedStatus, w.Code)

				if tc.expectedError != "" {
					var response map[string]interface{}
					err := json.Unmarshal(w.Body.Bytes(), &response)
					require.NoError(t, err)

					errorMsg, exists := response["error"]
					require.True(t, exists, "Expected error field in response")
					assert.Contains(t, errorMsg.(string), tc.expectedError)
				}
			})
		}
	})

	t.Run("Refresh token validation", func(t *testing.T) {
		testCases := []struct {
			name           string
			payload        map[string]interface{}
			expectedStatus int
			expectedError  string
		}{
			{
				name: "Valid refresh token",
				payload: map[string]interface{}{
					"refresh_token": "valid-refresh-token",
				},
				expectedStatus: http.StatusOK,
			},
			{
				name:           "Missing refresh token",
				payload:        map[string]interface{}{},
				expectedStatus: http.StatusBadRequest,
				expectedError:  "Invalid request payload",
			},
			{
				name: "Empty refresh token",
				payload: map[string]interface{}{
					"refresh_token": "",
				},
				expectedStatus: http.StatusBadRequest,
				expectedError:  "Invalid request payload",
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				jsonPayload, err := json.Marshal(tc.payload)
				require.NoError(t, err)

				req, err := http.NewRequest("POST", "/auth/refresh/validate", bytes.NewBuffer(jsonPayload))
				require.NoError(t, err)
				req.Header.Set("Content-Type", "application/json")

				w := httptest.NewRecorder()
				router.ServeHTTP(w, req)

				assert.Equal(t, tc.expectedStatus, w.Code)

				if tc.expectedError != "" {
					var response map[string]interface{}
					err := json.Unmarshal(w.Body.Bytes(), &response)
					require.NoError(t, err)

					errorMsg, exists := response["error"]
					require.True(t, exists, "Expected error field in response")
					assert.Contains(t, errorMsg.(string), tc.expectedError)
				}
			})
		}
	})
}
