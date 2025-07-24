package models

import (
	"time"

	"github.com/google/uuid"
)

// User represents a user in the system
type User struct {
	ID            uuid.UUID  `json:"id" db:"id"`
	Email         string     `json:"email" db:"email"`
	EmailVerified bool       `json:"email_verified" db:"email_verified"`
	IsActive      bool       `json:"is_active" db:"is_active"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at" db:"updated_at"`
	LastLogin     *time.Time `json:"last_login,omitempty" db:"last_login"`
}

// RegisterRequest represents the request payload for POST /auth/register
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

// LoginRequest represents the request payload for POST /auth/login
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse represents the response payload for POST /auth/login
type LoginResponse struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresAt    time.Time `json:"expires_at"`
	User         User      `json:"user"`
}

// RefreshTokenRequest represents the request payload for POST /auth/refresh
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// RefreshTokenResponse represents the response payload for POST /auth/refresh
type RefreshTokenResponse struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresAt    time.Time `json:"expires_at"`
}

// ChangePasswordRequest represents the request payload for POST /auth/change-password
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=8"`
}
