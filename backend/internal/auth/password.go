package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"

	"golang.org/x/crypto/argon2"
)

// PasswordManager handles password hashing and verification using Argon2id
type PasswordManager struct {
	memory      uint32 // Memory in KB
	iterations  uint32 // Number of iterations
	parallelism uint8  // Number of threads
	saltLength  uint32 // Salt length in bytes
	keyLength   uint32 // Key length in bytes
}

// NewPasswordManager creates a new password manager with 2025 security standards
func NewPasswordManager() *PasswordManager {
	return &PasswordManager{
		memory:      65536, // 64 MB
		iterations:  3,     // 3 iterations
		parallelism: 4,     // 4 threads
		saltLength:  16,    // 16 bytes salt
		keyLength:   32,    // 32 bytes key
	}
}

// HashPassword creates a hash of the given password using Argon2id
func (pm *PasswordManager) HashPassword(password string) (string, error) {
	// Generate a random salt
	salt := make([]byte, pm.saltLength)
	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("failed to generate salt: %w", err)
	}

	// Generate the hash
	hash := argon2.IDKey([]byte(password), salt, pm.iterations, pm.memory, pm.parallelism, pm.keyLength)

	// Encode the salt and hash to base64
	b64Salt := base64.RawStdEncoding.EncodeToString(salt)
	b64Hash := base64.RawStdEncoding.EncodeToString(hash)

	// Return the encoded hash in the format:
	// $argon2id$v=19$m=65536,t=3,p=4$salt$hash
	return fmt.Sprintf("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		argon2.Version, pm.memory, pm.iterations, pm.parallelism, b64Salt, b64Hash), nil
}

// VerifyPassword verifies a password against its hash
func (pm *PasswordManager) VerifyPassword(password, encodedHash string) (bool, error) {
	// Parse the encoded hash
	memory, iterations, parallelism, salt, hash, err := pm.parseHash(encodedHash)
	if err != nil {
		return false, fmt.Errorf("failed to parse hash: %w", err)
	}

	// Hash the password using the same parameters
	otherHash := argon2.IDKey([]byte(password), salt, iterations, memory, parallelism, pm.keyLength)

	// Use constant-time comparison to prevent timing attacks
	return subtle.ConstantTimeCompare(hash, otherHash) == 1, nil
}

// parseHash parses an encoded hash and extracts its components
func (pm *PasswordManager) parseHash(encodedHash string) (memory uint32, iterations uint32, parallelism uint8, salt, hash []byte, err error) {
	parts := strings.Split(encodedHash, "$")
	if len(parts) != 6 {
		return 0, 0, 0, nil, nil, errors.New("invalid hash format")
	}

	if parts[1] != "argon2id" {
		return 0, 0, 0, nil, nil, errors.New("incompatible hash algorithm")
	}

	var version int
	if _, err := fmt.Sscanf(parts[2], "v=%d", &version); err != nil {
		return 0, 0, 0, nil, nil, fmt.Errorf("invalid version: %w", err)
	}

	if version != argon2.Version {
		return 0, 0, 0, nil, nil, errors.New("incompatible argon2 version")
	}

	if _, err := fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &memory, &iterations, &parallelism); err != nil {
		return 0, 0, 0, nil, nil, fmt.Errorf("invalid parameters: %w", err)
	}

	salt, err = base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil {
		return 0, 0, 0, nil, nil, fmt.Errorf("invalid salt: %w", err)
	}

	hash, err = base64.RawStdEncoding.DecodeString(parts[5])
	if err != nil {
		return 0, 0, 0, nil, nil, fmt.Errorf("invalid hash: %w", err)
	}

	return memory, iterations, parallelism, salt, hash, nil
}

// ValidatePasswordStrength validates password strength
func (pm *PasswordManager) ValidatePasswordStrength(password string) error {
	if len(password) < 8 {
		return errors.New("password must be at least 8 characters long")
	}

	if len(password) > 128 {
		return errors.New("password must be no more than 128 characters long")
	}

	var (
		hasUpper   = false
		hasLower   = false
		hasNumber  = false
		hasSpecial = false
	)

	for _, char := range password {
		switch {
		case char >= 'A' && char <= 'Z':
			hasUpper = true
		case char >= 'a' && char <= 'z':
			hasLower = true
		case char >= '0' && char <= '9':
			hasNumber = true
		case char >= '!' && char <= '/' || char >= ':' && char <= '@' || char >= '[' && char <= '`' || char >= '{' && char <= '~':
			hasSpecial = true
		}
	}

	if !hasUpper {
		return errors.New("password must contain at least one uppercase letter")
	}

	if !hasLower {
		return errors.New("password must contain at least one lowercase letter")
	}

	if !hasNumber {
		return errors.New("password must contain at least one number")
	}

	if !hasSpecial {
		return errors.New("password must contain at least one special character")
	}

	return nil
}
