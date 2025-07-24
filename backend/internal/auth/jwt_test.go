package auth

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestJWTManager_GenerateAccessToken(t *testing.T) {
	// Setup
	jwtManager := NewJWTManager(
		"test-secret-key-32-characters-long",
		"test-issuer",
		"test-audience",
		15*time.Minute,
		7*24*time.Hour,
	)

	userID := uuid.New()
	email := "test@example.com"

	// Test
	token, expiresAt, err := jwtManager.GenerateAccessToken(userID, email)

	// Assertions
	require.NoError(t, err)
	assert.NotEmpty(t, token)
	assert.True(t, expiresAt.After(time.Now()))
	assert.True(t, expiresAt.Before(time.Now().Add(16*time.Minute))) // Should expire in ~15 minutes
}

func TestJWTManager_ValidateAccessToken(t *testing.T) {
	// Setup
	jwtManager := NewJWTManager(
		"test-secret-key-32-characters-long",
		"test-issuer",
		"test-audience",
		15*time.Minute,
		7*24*time.Hour,
	)

	userID := uuid.New()
	email := "test@example.com"

	// Generate token
	token, _, err := jwtManager.GenerateAccessToken(userID, email)
	require.NoError(t, err)

	// Test validation
	claims, err := jwtManager.ValidateAccessToken(token)

	// Assertions
	require.NoError(t, err)
	assert.Equal(t, userID, claims.UserID)
	assert.Equal(t, email, claims.Email)
	assert.Equal(t, "test-issuer", claims.Issuer)
	assert.Equal(t, "test-audience", claims.Audience)
}

func TestJWTManager_ValidateAccessToken_InvalidToken(t *testing.T) {
	jwtManager := NewJWTManager(
		"test-secret-key-32-characters-long",
		"test-issuer",
		"test-audience",
		15*time.Minute,
		7*24*time.Hour,
	)

	// Test with invalid token
	_, err := jwtManager.ValidateAccessToken("invalid-token")
	assert.Error(t, err)
}

func TestJWTManager_ValidateAccessToken_WrongSecret(t *testing.T) {
	// Generate token with one secret
	jwtManager1 := NewJWTManager(
		"test-secret-key-32-characters-long",
		"test-issuer",
		"test-audience",
		15*time.Minute,
		7*24*time.Hour,
	)

	userID := uuid.New()
	token, _, err := jwtManager1.GenerateAccessToken(userID, "test@example.com")
	require.NoError(t, err)

	// Try to validate with different secret
	jwtManager2 := NewJWTManager(
		"different-secret-key-32-chars-long",
		"test-issuer",
		"test-audience",
		15*time.Minute,
		7*24*time.Hour,
	)

	_, err = jwtManager2.ValidateAccessToken(token)
	assert.Error(t, err)
}

func TestJWTManager_RefreshToken(t *testing.T) {
	// Setup
	jwtManager := NewJWTManager(
		"test-secret-key-32-characters-long",
		"test-issuer",
		"test-audience",
		15*time.Minute,
		7*24*time.Hour,
	)

	userID := uuid.New()

	// Generate refresh token
	token, expiresAt, err := jwtManager.GenerateRefreshToken(userID)
	require.NoError(t, err)
	assert.NotEmpty(t, token)
	assert.True(t, expiresAt.After(time.Now().Add(6*24*time.Hour))) // Should expire in ~7 days

	// Validate refresh token
	claims, err := jwtManager.ValidateRefreshToken(token)
	require.NoError(t, err)
	assert.Equal(t, userID.String(), claims.Subject)

	// Extract user ID
	extractedUserID, err := jwtManager.ExtractUserIDFromRefreshToken(token)
	require.NoError(t, err)
	assert.Equal(t, userID, extractedUserID)
}

func TestJWTManager_RefreshToken_InvalidAudience(t *testing.T) {
	// Generate token with one audience
	jwtManager1 := NewJWTManager(
		"test-secret-key-32-characters-long",
		"test-issuer",
		"test-audience",
		15*time.Minute,
		7*24*time.Hour,
	)

	userID := uuid.New()
	token, _, err := jwtManager1.GenerateRefreshToken(userID)
	require.NoError(t, err)

	// Try to validate with different audience
	jwtManager2 := NewJWTManager(
		"test-secret-key-32-characters-long",
		"test-issuer",
		"different-audience",
		15*time.Minute,
		7*24*time.Hour,
	)

	_, err = jwtManager2.ValidateRefreshToken(token)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid audience")
}
