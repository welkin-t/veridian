package models

import (
	"time"

	"github.com/google/uuid"
)

// Job represents a job definition in the database
type Job struct {
	ID                  uuid.UUID              `json:"id" db:"id"`
	OwnerID             uuid.UUID              `json:"owner_id" db:"owner_id"`
	ImageURI            string                 `json:"image_uri" db:"image_uri"`
	EnvVars             map[string]interface{} `json:"env_vars" db:"env_vars"`
	DelayToleranceHours int                    `json:"delay_tolerance_hours" db:"delay_tolerance_hours"`
	CreatedAt           time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time              `json:"updated_at" db:"updated_at"`
}

// CreateJobRequest represents the request payload for POST /jobs
type CreateJobRequest struct {
	ImageURI            string                 `json:"image_uri" validate:"required" binding:"required"`
	EnvVars             map[string]interface{} `json:"env_vars,omitempty"`
	DelayToleranceHours int                    `json:"delay_tolerance_hours" validate:"required,min=0,max=168" binding:"required,min=0,max=168"`
}

// CreateJobResponse represents the response payload for POST /jobs
type CreateJobResponse struct {
	ID                  uuid.UUID              `json:"id"`
	OwnerID             uuid.UUID              `json:"owner_id"`
	ImageURI            string                 `json:"image_uri"`
	EnvVars             map[string]interface{} `json:"env_vars"`
	DelayToleranceHours int                    `json:"delay_tolerance_hours"`
	CreatedAt           time.Time              `json:"created_at"`
	UpdatedAt           time.Time              `json:"updated_at"`
}
