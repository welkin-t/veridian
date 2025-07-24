package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/nouvadev/veridian/backend/internal/app"
	"github.com/nouvadev/veridian/backend/internal/database"
	"github.com/nouvadev/veridian/backend/internal/middleware"
	"github.com/nouvadev/veridian/backend/internal/models"
)

// CreateJob handles POST /jobs
func CreateJob(c *gin.Context, app *app.App) {
	if !middleware.RequireAuth(c) {
		return
	}

	var req models.CreateJobRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request payload",
			"details": err.Error(),
		})
		return
	}

	// Get authenticated user ID from JWT token
	ownerID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	ctx := c.Request.Context()

	// Create job in database using SQLC
	params := database.CreateJobParams{
		OwnerID:             ownerID,
		ImageUri:            req.ImageURI,
		EnvVars:             convertEnvVarsToJSON(req.EnvVars),
		DelayToleranceHours: int32(req.DelayToleranceHours),
	}

	job, err := app.Queries.CreateJob(ctx, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create job",
		})
		return
	}

	response := models.CreateJobResponse{
		ID:                  job.ID,
		OwnerID:             job.OwnerID,
		ImageURI:            job.ImageUri,
		EnvVars:             convertJSONToEnvVars(job.EnvVars),
		DelayToleranceHours: int(job.DelayToleranceHours),
		CreatedAt:           job.CreatedAt,
		UpdatedAt:           job.UpdatedAt,
	}

	c.JSON(http.StatusCreated, response)
}

// GetJobs handles GET /jobs
func GetJobs(c *gin.Context, app *app.App) {
	if !middleware.RequireAuth(c) {
		return
	}

	// Get authenticated user ID from JWT token
	ownerID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	ctx := c.Request.Context()

	jobs, err := app.Queries.GetJobsByOwner(ctx, ownerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch jobs",
		})
		return
	}

	// Convert database jobs to API response format
	apiJobs := make([]models.Job, len(jobs))
	for i, job := range jobs {
		apiJobs[i] = models.Job{
			ID:                  job.ID,
			OwnerID:             job.OwnerID,
			ImageURI:            job.ImageUri,
			EnvVars:             convertJSONToEnvVars(job.EnvVars),
			DelayToleranceHours: int(job.DelayToleranceHours),
			CreatedAt:           job.CreatedAt,
			UpdatedAt:           job.UpdatedAt,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"jobs": apiJobs,
	})
}

// GetJob handles GET /jobs/:id
func GetJob(c *gin.Context, app *app.App) {
	if !middleware.RequireAuth(c) {
		return
	}

	jobIDStr := c.Param("id")
	jobID, err := uuid.Parse(jobIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid job ID format",
		})
		return
	}

	// Get authenticated user ID from JWT token
	ownerID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	ctx := c.Request.Context()

	job, err := app.Queries.GetJob(ctx, database.GetJobParams{
		ID:      jobID,
		OwnerID: ownerID,
	})
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Job not found",
		})
		return
	}

	apiJob := models.Job{
		ID:                  job.ID,
		OwnerID:             job.OwnerID,
		ImageURI:            job.ImageUri,
		EnvVars:             convertJSONToEnvVars(job.EnvVars),
		DelayToleranceHours: int(job.DelayToleranceHours),
		CreatedAt:           job.CreatedAt,
		UpdatedAt:           job.UpdatedAt,
	}

	c.JSON(http.StatusOK, apiJob)
}

// UpdateJob handles PUT /jobs/:id
func UpdateJob(c *gin.Context, app *app.App) {
	if !middleware.RequireAuth(c) {
		return
	}

	jobIDStr := c.Param("id")
	jobID, err := uuid.Parse(jobIDStr)
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

	// Get authenticated user ID from JWT token
	ownerID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	ctx := c.Request.Context()

	params := database.UpdateJobParams{
		ID:                  jobID,
		OwnerID:             ownerID,
		ImageUri:            req.ImageURI,
		EnvVars:             convertEnvVarsToJSON(req.EnvVars),
		DelayToleranceHours: int32(req.DelayToleranceHours),
	}

	job, err := app.Queries.UpdateJob(ctx, params)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Job not found or permission denied",
		})
		return
	}

	response := models.CreateJobResponse{
		ID:                  job.ID,
		OwnerID:             job.OwnerID,
		ImageURI:            job.ImageUri,
		EnvVars:             convertJSONToEnvVars(job.EnvVars),
		DelayToleranceHours: int(job.DelayToleranceHours),
		CreatedAt:           job.CreatedAt,
		UpdatedAt:           job.UpdatedAt,
	}

	c.JSON(http.StatusOK, response)
}

// DeleteJob handles DELETE /jobs/:id
func DeleteJob(c *gin.Context, app *app.App) {
	if !middleware.RequireAuth(c) {
		return
	}

	jobIDStr := c.Param("id")
	jobID, err := uuid.Parse(jobIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid job ID format",
		})
		return
	}

	// Get authenticated user ID from JWT token
	ownerID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	ctx := c.Request.Context()

	err = app.Queries.DeleteJob(ctx, database.DeleteJobParams{
		ID:      jobID,
		OwnerID: ownerID,
	})
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Job not found or permission denied",
		})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// Helper functions for converting between JSON and map[string]interface{}
func convertEnvVarsToJSON(envVars map[string]interface{}) []byte {
	if envVars == nil {
		return []byte("{}")
	}

	jsonData, err := json.Marshal(envVars)
	if err != nil {
		return []byte("{}")
	}
	return jsonData
}

func convertJSONToEnvVars(jsonData []byte) map[string]interface{} {
	if len(jsonData) == 0 {
		return make(map[string]interface{})
	}

	var envVars map[string]interface{}
	if err := json.Unmarshal(jsonData, &envVars); err != nil {
		return make(map[string]interface{})
	}

	return envVars
}
