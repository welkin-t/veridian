package auth

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPasswordManager_HashPassword(t *testing.T) {
	pm := NewPasswordManager()
	password := "TestPassword123!"

	// Test hashing
	hash, err := pm.HashPassword(password)
	require.NoError(t, err)
	assert.NotEmpty(t, hash)
	assert.True(t, strings.HasPrefix(hash, "$argon2id$"))
	assert.NotEqual(t, password, hash) // Should be different from plaintext
}

func TestPasswordManager_VerifyPassword(t *testing.T) {
	pm := NewPasswordManager()
	password := "TestPassword123!"

	// Hash password
	hash, err := pm.HashPassword(password)
	require.NoError(t, err)

	// Test correct password
	isValid, err := pm.VerifyPassword(password, hash)
	require.NoError(t, err)
	assert.True(t, isValid)

	// Test incorrect password
	isValid, err = pm.VerifyPassword("WrongPassword", hash)
	require.NoError(t, err)
	assert.False(t, isValid)
}

func TestPasswordManager_VerifyPassword_InvalidHash(t *testing.T) {
	pm := NewPasswordManager()

	// Test with invalid hash format
	_, err := pm.VerifyPassword("password", "invalid-hash")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid hash format")
}

func TestPasswordManager_ValidatePasswordStrength(t *testing.T) {
	pm := NewPasswordManager()

	testCases := []struct {
		name     string
		password string
		wantErr  bool
		errMsg   string
	}{
		{
			name:     "Valid strong password",
			password: "StrongPass123!",
			wantErr:  false,
		},
		{
			name:     "Too short",
			password: "Short1!",
			wantErr:  true,
			errMsg:   "at least 8 characters",
		},
		{
			name:     "Too long",
			password: strings.Repeat("a", 129) + "A1!",
			wantErr:  true,
			errMsg:   "no more than 128 characters",
		},
		{
			name:     "No uppercase",
			password: "lowercase123!",
			wantErr:  true,
			errMsg:   "uppercase letter",
		},
		{
			name:     "No lowercase",
			password: "UPPERCASE123!",
			wantErr:  true,
			errMsg:   "lowercase letter",
		},
		{
			name:     "No number",
			password: "NoNumber!",
			wantErr:  true,
			errMsg:   "number",
		},
		{
			name:     "No special character",
			password: "NoSpecial123",
			wantErr:  true,
			errMsg:   "special character",
		},
		{
			name:     "All requirements met with symbols",
			password: "Valid@Pass123",
			wantErr:  false,
		},
		{
			name:     "All requirements met with brackets",
			password: "Valid[Pass]123",
			wantErr:  false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			err := pm.ValidatePasswordStrength(tc.password)

			if tc.wantErr {
				assert.Error(t, err)
				if tc.errMsg != "" {
					assert.Contains(t, err.Error(), tc.errMsg)
				}
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestPasswordManager_HashVerify_Consistency(t *testing.T) {
	pm := NewPasswordManager()
	password := "ConsistentTest123!"

	// Hash the same password multiple times
	hash1, err1 := pm.HashPassword(password)
	hash2, err2 := pm.HashPassword(password)

	require.NoError(t, err1)
	require.NoError(t, err2)

	// Hashes should be different (due to random salt)
	assert.NotEqual(t, hash1, hash2)

	// But both should verify correctly
	valid1, err1 := pm.VerifyPassword(password, hash1)
	valid2, err2 := pm.VerifyPassword(password, hash2)

	require.NoError(t, err1)
	require.NoError(t, err2)
	assert.True(t, valid1)
	assert.True(t, valid2)
}

func BenchmarkPasswordManager_HashPassword(b *testing.B) {
	pm := NewPasswordManager()
	password := "BenchmarkPassword123!"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := pm.HashPassword(password)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkPasswordManager_VerifyPassword(b *testing.B) {
	pm := NewPasswordManager()
	password := "BenchmarkPassword123!"

	// Pre-hash the password
	hash, err := pm.HashPassword(password)
	if err != nil {
		b.Fatal(err)
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := pm.VerifyPassword(password, hash)
		if err != nil {
			b.Fatal(err)
		}
	}
}
