package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/nouvadev/veridian/backend/internal/models"
)

// CreateJob handles POST /jobs
func CreateJob(c *gin.Context) {
	var req models.CreateJobRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request payload",
			"details": err.Error(),
		})
		return
	}

	// TODO: Get owner_id from JWT token or authentication context
	ownerID := uuid.New() // Placeholder - should come from auth

	// Create job
	job := models.Job{
		ID:                  uuid.New(),
		OwnerID:             ownerID,
		ImageURI:            req.ImageURI,
		EnvVars:             req.EnvVars,
		DelayToleranceHours: req.DelayToleranceHours,
		CreatedAt:           time.Now(),
		UpdatedAt:           time.Now(),
	}

	// TODO: Save to database
	// For now, return the created job as response

	response := models.CreateJobResponse{
		ID:                  job.ID,
		OwnerID:             job.OwnerID,
		ImageURI:            job.ImageURI,
		EnvVars:             job.EnvVars,
		DelayToleranceHours: job.DelayToleranceHours,
		CreatedAt:           job.CreatedAt,
		UpdatedAt:           job.UpdatedAt,
	}

	c.JSON(http.StatusCreated, response)
}

// GetJobs handles GET /jobs
func GetJobs(c *gin.Context) {
	// TODO: Get owner_id from JWT token or authentication context
	// TODO: Fetch jobs from database for the authenticated user

	// Placeholder response
	jobs := []models.Job{}

	c.JSON(http.StatusOK, gin.H{
		"jobs": jobs,
	})
}

// GetJob handles GET /jobs/:id
func GetJob(c *gin.Context) {
	jobIDStr := c.Param("id")
	_, err := uuid.Parse(jobIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid job ID format",
		})
		return
	}

	// TODO: Get owner_id from JWT token or authentication context
	// TODO: Fetch job from database and verify ownership

	// Placeholder response
	c.JSON(http.StatusNotFound, gin.H{
		"error": "Job not found",
	})
}

// UpdateJob handles PUT /jobs/:id
func UpdateJob(c *gin.Context) {
	jobIDStr := c.Param("id")
	_, err := uuid.Parse(jobIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid job ID format",
		})
		return
	}

	var req models.CreateJobRequest // Using same struct for update

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request payload",
			"details": err.Error(),
		})
		return
	}

	// TODO: Get owner_id from JWT token or authentication context
	// TODO: Fetch job from database, verify ownership, and update

	// Placeholder response
	c.JSON(http.StatusNotFound, gin.H{
		"error": "Job not found",
	})
}

// DeleteJob handles DELETE /jobs/:id
func DeleteJob(c *gin.Context) {
	jobIDStr := c.Param("id")
	_, err := uuid.Parse(jobIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid job ID format",
		})
		return
	}

	// TODO: Get owner_id from JWT token or authentication context
	// TODO: Fetch job from database, verify ownership, and delete

	// Placeholder response
	c.JSON(http.StatusNotFound, gin.H{
		"error": "Job not found",
	})
}
