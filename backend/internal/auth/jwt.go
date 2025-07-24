package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// JWTClaims represents the JWT claims
type JWTClaims struct {
	UserID    uuid.UUID `json:"sub"`
	Email     string    `json:"email"`
	IssuedAt  int64     `json:"iat"`
	ExpiresAt int64     `json:"exp"`
	NotBefore int64     `json:"nbf"`
	Issuer    string    `json:"iss"`
	Audience  string    `json:"aud"`
	JTI       string    `json:"jti"` // JWT ID for revocation
	jwt.RegisteredClaims
}

// JWTManager handles JWT token operations
type JWTManager struct {
	secretKey       string
	issuer          string
	audience        string
	accessTokenTTL  time.Duration
	refreshTokenTTL time.Duration
}

// NewJWTManager creates a new JWT manager
func NewJWTManager(secretKey, issuer, audience string, accessTTL, refreshTTL time.Duration) *JWTManager {
	return &JWTManager{
		secretKey:       secretKey,
		issuer:          issuer,
		audience:        audience,
		accessTokenTTL:  accessTTL,
		refreshTokenTTL: refreshTTL,
	}
}

// GenerateAccessToken generates a new access token
func (j *JWTManager) GenerateAccessToken(userID uuid.UUID, email string) (string, time.Time, error) {
	now := time.Now()
	expiresAt := now.Add(j.accessTokenTTL)

	claims := JWTClaims{
		UserID:    userID,
		Email:     email,
		IssuedAt:  now.Unix(),
		ExpiresAt: expiresAt.Unix(),
		NotBefore: now.Unix(),
		Issuer:    j.issuer,
		Audience:  j.audience,
		JTI:       uuid.New().String(),
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			NotBefore: jwt.NewNumericDate(now),
			Issuer:    j.issuer,
			Audience:  []string{j.audience},
			ID:        uuid.New().String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(j.secretKey))
	if err != nil {
		return "", time.Time{}, err
	}

	return tokenString, expiresAt, nil
}

// GenerateRefreshToken generates a new refresh token
func (j *JWTManager) GenerateRefreshToken(userID uuid.UUID) (string, time.Time, error) {
	now := time.Now()
	expiresAt := now.Add(j.refreshTokenTTL)

	claims := jwt.RegisteredClaims{
		Subject:   userID.String(),
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(expiresAt),
		NotBefore: jwt.NewNumericDate(now),
		Issuer:    j.issuer,
		Audience:  []string{j.audience},
		ID:        uuid.New().String(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(j.secretKey))
	if err != nil {
		return "", time.Time{}, err
	}

	return tokenString, expiresAt, nil
}

// ValidateAccessToken validates and parses an access token
func (j *JWTManager) ValidateAccessToken(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(j.secretKey), nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	// Additional validation
	if claims.Audience != j.audience {
		return nil, errors.New("invalid audience")
	}

	if claims.Issuer != j.issuer {
		return nil, errors.New("invalid issuer")
	}

	return claims, nil
}

// ValidateRefreshToken validates and parses a refresh token
func (j *JWTManager) ValidateRefreshToken(tokenString string) (*jwt.RegisteredClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(j.secretKey), nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	claims, ok := token.Claims.(*jwt.RegisteredClaims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	// Additional validation
	if len(claims.Audience) == 0 || claims.Audience[0] != j.audience {
		return nil, errors.New("invalid audience")
	}

	if claims.Issuer != j.issuer {
		return nil, errors.New("invalid issuer")
	}

	return claims, nil
}

// ExtractUserIDFromRefreshToken extracts user ID from refresh token
func (j *JWTManager) ExtractUserIDFromRefreshToken(tokenString string) (uuid.UUID, error) {
	claims, err := j.ValidateRefreshToken(tokenString)
	if err != nil {
		return uuid.Nil, err
	}

	userID, err := uuid.Parse(claims.Subject)
	if err != nil {
		return uuid.Nil, errors.New("invalid user ID in token")
	}

	return userID, nil
}
