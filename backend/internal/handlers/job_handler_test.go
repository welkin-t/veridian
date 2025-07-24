package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/nouvadev/veridian/backend/internal/database"
	"github.com/nouvadev/veridian/backend/internal/models"
)

// MockQuerier is a mock implementation of database.Querier
type MockQuerier struct {
	jobs         map[uuid.UUID]database.Job
	jobsByOwner  map[uuid.UUID][]database.Job
	shouldError  bool
	errorMessage string
}

func NewMockQuerier() *MockQuerier {
	return &MockQuerier{
		jobs:        make(map[uuid.UUID]database.Job),
		jobsByOwner: make(map[uuid.UUID][]database.Job),
	}
}

func (m *MockQuerier) SetError(shouldError bool, message string) {
	m.shouldError = shouldError
	m.errorMessage = message
}

func (m *MockQuerier) CreateJob(ctx context.Context, arg database.CreateJobParams) (database.Job, error) {
	if m.shouldError {
		return database.Job{}, fmt.Errorf("%s", m.errorMessage)
	}

	job := database.Job{
		ID:                  uuid.New(),
		OwnerID:             arg.OwnerID,
		ImageUri:            arg.ImageUri,
		EnvVars:             arg.EnvVars,
		DelayToleranceHours: arg.DelayToleranceHours,
		CreatedAt:           time.Now(),
		UpdatedAt:           time.Now(),
	}

	m.jobs[job.ID] = job
	m.jobsByOwner[arg.OwnerID] = append(m.jobsByOwner[arg.OwnerID], job)

	return job, nil
}

func (m *MockQuerier) GetJobsByOwner(ctx context.Context, ownerID uuid.UUID) ([]database.Job, error) {
	if m.shouldError {
		return nil, fmt.Errorf("%s", m.errorMessage)
	}

	jobs, exists := m.jobsByOwner[ownerID]
	if !exists {
		return []database.Job{}, nil
	}

	return jobs, nil
}

func (m *MockQuerier) GetJob(ctx context.Context, arg database.GetJobParams) (database.Job, error) {
	if m.shouldError {
		return database.Job{}, fmt.Errorf("%s", m.errorMessage)
	}

	job, exists := m.jobs[arg.ID]
	if !exists || job.OwnerID != arg.OwnerID {
		return database.Job{}, fmt.Errorf("job not found")
	}

	return job, nil
}

func (m *MockQuerier) UpdateJob(ctx context.Context, arg database.UpdateJobParams) (database.Job, error) {
	if m.shouldError {
		return database.Job{}, fmt.Errorf("%s", m.errorMessage)
	}

	job, exists := m.jobs[arg.ID]
	if !exists || job.OwnerID != arg.OwnerID {
		return database.Job{}, fmt.Errorf("job not found")
	}

	job.ImageUri = arg.ImageUri
	job.EnvVars = arg.EnvVars
	job.DelayToleranceHours = arg.DelayToleranceHours
	job.UpdatedAt = time.Now()

	m.jobs[arg.ID] = job

	// Update in jobsByOwner map
	ownerJobs := m.jobsByOwner[arg.OwnerID]
	for i, j := range ownerJobs {
		if j.ID == arg.ID {
			ownerJobs[i] = job
			break
		}
	}

	return job, nil
}

func (m *MockQuerier) DeleteJob(ctx context.Context, arg database.DeleteJobParams) error {
	if m.shouldError {
		return fmt.Errorf("%s", m.errorMessage)
	}

	job, exists := m.jobs[arg.ID]
	if !exists || job.OwnerID != arg.OwnerID {
		return fmt.Errorf("job not found")
	}

	delete(m.jobs, arg.ID)

	// Remove from jobsByOwner
	ownerJobs := m.jobsByOwner[arg.OwnerID]
	for i, j := range ownerJobs {
		if j.ID == arg.ID {
			m.jobsByOwner[arg.OwnerID] = append(ownerJobs[:i], ownerJobs[i+1:]...)
			break
		}
	}

	return nil
}

// Stub implementations for other required methods to satisfy database.Querier interface
func (m *MockQuerier) CreateExecution(ctx context.Context, arg database.CreateExecutionParams) (database.Execution, error) {
	return database.Execution{}, nil
}
func (m *MockQuerier) CreateRefreshToken(ctx context.Context, arg database.CreateRefreshTokenParams) (database.RefreshToken, error) {
	return database.RefreshToken{}, nil
}
func (m *MockQuerier) CreateUser(ctx context.Context, arg database.CreateUserParams) (database.User, error) {
	return database.User{}, nil
}
func (m *MockQuerier) DeactivateUser(ctx context.Context, id uuid.UUID) error {
	return nil
}
func (m *MockQuerier) DeleteExecution(ctx context.Context, id uuid.UUID) error {
	return nil
}
func (m *MockQuerier) DeleteExpiredRefreshTokens(ctx context.Context) error {
	return nil
}
func (m *MockQuerier) DeleteUser(ctx context.Context, id uuid.UUID) error {
	return nil
}
func (m *MockQuerier) GetExecution(ctx context.Context, id uuid.UUID) (database.Execution, error) {
	return database.Execution{}, nil
}
func (m *MockQuerier) GetExecutionStats(ctx context.Context, jobID uuid.UUID) (database.GetExecutionStatsRow, error) {
	return database.GetExecutionStatsRow{}, nil
}
func (m *MockQuerier) GetExecutionsByJobID(ctx context.Context, jobID uuid.UUID) ([]database.Execution, error) {
	return []database.Execution{}, nil
}
func (m *MockQuerier) GetExecutionsByJobIDWithLimit(ctx context.Context, arg database.GetExecutionsByJobIDWithLimitParams) ([]database.Execution, error) {
	return []database.Execution{}, nil
}
func (m *MockQuerier) GetExecutionsByStatus(ctx context.Context, status database.ExecutionStatus) ([]database.Execution, error) {
	return []database.Execution{}, nil
}
func (m *MockQuerier) GetJobCount(ctx context.Context, ownerID uuid.UUID) (int64, error) {
	return 0, nil
}
func (m *MockQuerier) GetJobsByOwnerWithLimit(ctx context.Context, arg database.GetJobsByOwnerWithLimitParams) ([]database.Job, error) {
	return []database.Job{}, nil
}
func (m *MockQuerier) GetPendingExecutions(ctx context.Context) ([]database.Execution, error) {
	return []database.Execution{}, nil
}
func (m *MockQuerier) GetRecentJobs(ctx context.Context, arg database.GetRecentJobsParams) ([]database.Job, error) {
	return []database.Job{}, nil
}
func (m *MockQuerier) GetRefreshToken(ctx context.Context, tokenHash string) (database.RefreshToken, error) {
	return database.RefreshToken{}, nil
}
func (m *MockQuerier) GetUserByEmail(ctx context.Context, email string) (database.User, error) {
	return database.User{}, nil
}
func (m *MockQuerier) GetUserByEmailIncludeInactive(ctx context.Context, email string) (database.User, error) {
	return database.User{}, nil
}
func (m *MockQuerier) GetUserByID(ctx context.Context, id uuid.UUID) (database.User, error) {
	return database.User{}, nil
}
func (m *MockQuerier) GetUserExecutionStats(ctx context.Context, ownerID uuid.UUID) (database.GetUserExecutionStatsRow, error) {
	return database.GetUserExecutionStatsRow{}, nil
}
func (m *MockQuerier) GetUserRefreshTokens(ctx context.Context, userID uuid.UUID) ([]database.RefreshToken, error) {
	return []database.RefreshToken{}, nil
}
func (m *MockQuerier) RevokeAllUserRefreshTokens(ctx context.Context, userID uuid.UUID) error {
	return nil
}
func (m *MockQuerier) RevokeRefreshToken(ctx context.Context, tokenHash string) error {
	return nil
}
func (m *MockQuerier) UpdateExecutionComplete(ctx context.Context, arg database.UpdateExecutionCompleteParams) (database.Execution, error) {
	return database.Execution{}, nil
}
func (m *MockQuerier) UpdateExecutionCostEstimate(ctx context.Context, arg database.UpdateExecutionCostEstimateParams) (database.Execution, error) {
	return database.Execution{}, nil
}
func (m *MockQuerier) UpdateExecutionScheduling(ctx context.Context, arg database.UpdateExecutionSchedulingParams) (database.Execution, error) {
	return database.Execution{}, nil
}
func (m *MockQuerier) UpdateExecutionStart(ctx context.Context, arg database.UpdateExecutionStartParams) (database.Execution, error) {
	return database.Execution{}, nil
}
func (m *MockQuerier) UpdateExecutionStatus(ctx context.Context, arg database.UpdateExecutionStatusParams) (database.Execution, error) {
	return database.Execution{}, nil
}
func (m *MockQuerier) UpdateRefreshTokenLastUsed(ctx context.Context, id uuid.UUID) error {
	return nil
}
func (m *MockQuerier) UpdateUserEmailVerified(ctx context.Context, arg database.UpdateUserEmailVerifiedParams) error {
	return nil
}
func (m *MockQuerier) UpdateUserLastLogin(ctx context.Context, id uuid.UUID) error {
	return nil
}
func (m *MockQuerier) UpdateUserPassword(ctx context.Context, arg database.UpdateUserPasswordParams) (database.User, error) {
	return database.User{}, nil
}

// createTestJobHandler creates a job handler that directly handles the request without complex app struct
func createTestJobHandler(querier database.Querier) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Simulate the middleware authentication check
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authentication required",
			})
			c.Abort()
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

		ctx := c.Request.Context()

		// Create job in database using SQLC
		params := database.CreateJobParams{
			OwnerID:             userID.(uuid.UUID),
			ImageUri:            req.ImageURI,
			EnvVars:             convertEnvVarsToJSON(req.EnvVars),
			DelayToleranceHours: int32(req.DelayToleranceHours),
		}

		job, err := querier.CreateJob(ctx, params)
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
}

func createTestGetJobsHandler(querier database.Querier) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authentication required",
			})
			c.Abort()
			return
		}

		ctx := c.Request.Context()

		jobs, err := querier.GetJobsByOwner(ctx, userID.(uuid.UUID))
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
}

func createTestGetJobHandler(querier database.Querier) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authentication required",
			})
			c.Abort()
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

		ctx := c.Request.Context()

		job, err := querier.GetJob(ctx, database.GetJobParams{
			ID:      jobID,
			OwnerID: userID.(uuid.UUID),
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
}

// Test CreateJob success
func TestCreateJob_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create mock querier
	mockQuerier := NewMockQuerier()

	// Test user ID
	testUserID := uuid.New()

	// Prepare request
	reqBody := models.CreateJobRequest{
		ImageURI:            "docker.io/test/image:latest",
		EnvVars:             map[string]interface{}{"ENV_VAR1": "value1", "ENV_VAR2": "value2"},
		DelayToleranceHours: 24,
	}

	// Create request
	jsonBody, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/jobs", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	// Create recorder and context
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req

	// Set user_id in context to simulate authentication
	c.Set("user_id", testUserID)

	// Call handler
	handler := createTestJobHandler(mockQuerier)
	handler(c)

	// Verify response
	assert.Equal(t, http.StatusCreated, w.Code)

	var response models.CreateJobResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, testUserID, response.OwnerID)
	assert.Equal(t, reqBody.ImageURI, response.ImageURI)
	assert.Equal(t, reqBody.DelayToleranceHours, response.DelayToleranceHours)
	assert.Equal(t, reqBody.EnvVars, response.EnvVars)
}

// Test CreateJob with invalid JSON
func TestCreateJob_InvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockQuerier := NewMockQuerier()
	testUserID := uuid.New()

	req, _ := http.NewRequest("POST", "/jobs", bytes.NewBuffer([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set("user_id", testUserID)

	handler := createTestJobHandler(mockQuerier)
	handler(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Equal(t, "Invalid request payload", response["error"])
}

// Test CreateJob without authentication
func TestCreateJob_Unauthenticated(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockQuerier := NewMockQuerier()

	reqBody := models.CreateJobRequest{
		ImageURI:            "docker.io/test/image:latest",
		DelayToleranceHours: 24,
	}

	jsonBody, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/jobs", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	// Don't set user_id to simulate unauthenticated request

	handler := createTestJobHandler(mockQuerier)
	handler(c)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

// Test CreateJob with database error
func TestCreateJob_DatabaseError(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockQuerier := NewMockQuerier()
	mockQuerier.SetError(true, "database error")

	testUserID := uuid.New()

	reqBody := models.CreateJobRequest{
		ImageURI:            "docker.io/test/image:latest",
		EnvVars:             map[string]interface{}{"ENV_VAR1": "value1"},
		DelayToleranceHours: 24,
	}

	jsonBody, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "/jobs", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set("user_id", testUserID)

	handler := createTestJobHandler(mockQuerier)
	handler(c)

	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Equal(t, "Failed to create job", response["error"])
}

// Test GetJobs success
func TestGetJobs_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockQuerier := NewMockQuerier()
	testUserID := uuid.New()

	// Create some test jobs in the mock
	_, _ = mockQuerier.CreateJob(context.Background(), database.CreateJobParams{
		OwnerID:             testUserID,
		ImageUri:            "docker.io/test/image:latest",
		EnvVars:             []byte(`{"ENV_VAR1":"value1"}`),
		DelayToleranceHours: 24,
	})

	_, _ = mockQuerier.CreateJob(context.Background(), database.CreateJobParams{
		OwnerID:             testUserID,
		ImageUri:            "docker.io/test/image2:latest",
		EnvVars:             []byte(`{"ENV_VAR2":"value2"}`),
		DelayToleranceHours: 12,
	})

	req, _ := http.NewRequest("GET", "/jobs", nil)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set("user_id", testUserID)

	handler := createTestGetJobsHandler(mockQuerier)
	handler(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	jobs, ok := response["jobs"].([]interface{})
	require.True(t, ok)
	assert.Len(t, jobs, 2)
}

// Test GetJobs with database error
func TestGetJobs_DatabaseError(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockQuerier := NewMockQuerier()
	mockQuerier.SetError(true, "database error")

	testUserID := uuid.New()

	req, _ := http.NewRequest("GET", "/jobs", nil)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set("user_id", testUserID)

	handler := createTestGetJobsHandler(mockQuerier)
	handler(c)

	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Equal(t, "Failed to fetch jobs", response["error"])
}

// Test GetJob success
func TestGetJob_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockQuerier := NewMockQuerier()
	testUserID := uuid.New()

	// Create a test job
	createdJob, _ := mockQuerier.CreateJob(context.Background(), database.CreateJobParams{
		OwnerID:             testUserID,
		ImageUri:            "docker.io/test/image:latest",
		EnvVars:             []byte(`{"ENV_VAR1":"value1"}`),
		DelayToleranceHours: 24,
	})

	req, _ := http.NewRequest("GET", fmt.Sprintf("/jobs/%s", createdJob.ID), nil)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set("user_id", testUserID)
	c.Params = []gin.Param{{Key: "id", Value: createdJob.ID.String()}}

	handler := createTestGetJobHandler(mockQuerier)
	handler(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.Job
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, createdJob.ID, response.ID)
	assert.Equal(t, testUserID, response.OwnerID)
}

// Test GetJob with invalid UUID
func TestGetJob_InvalidUUID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockQuerier := NewMockQuerier()
	testUserID := uuid.New()

	req, _ := http.NewRequest("GET", "/jobs/invalid-uuid", nil)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set("user_id", testUserID)
	c.Params = []gin.Param{{Key: "id", Value: "invalid-uuid"}}

	handler := createTestGetJobHandler(mockQuerier)
	handler(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Equal(t, "Invalid job ID format", response["error"])
}

// Test GetJob not found
func TestGetJob_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockQuerier := NewMockQuerier()
	testUserID := uuid.New()
	nonExistentJobID := uuid.New()

	req, _ := http.NewRequest("GET", fmt.Sprintf("/jobs/%s", nonExistentJobID), nil)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set("user_id", testUserID)
	c.Params = []gin.Param{{Key: "id", Value: nonExistentJobID.String()}}

	handler := createTestGetJobHandler(mockQuerier)
	handler(c)

	assert.Equal(t, http.StatusNotFound, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Equal(t, "Job not found", response["error"])
}

// Test helper functions
func TestConvertEnvVarsToJSON(t *testing.T) {
	// Test with valid map
	envVars := map[string]interface{}{
		"VAR1": "value1",
		"VAR2": "value2",
	}
	result := convertEnvVarsToJSON(envVars)

	var parsed map[string]interface{}
	err := json.Unmarshal(result, &parsed)
	require.NoError(t, err)
	assert.Equal(t, envVars, parsed)

	// Test with nil
	result = convertEnvVarsToJSON(nil)
	assert.Equal(t, []byte("{}"), result)
}

func TestConvertJSONToEnvVars(t *testing.T) {
	// Test with valid JSON
	jsonData := []byte(`{"VAR1":"value1","VAR2":"value2"}`)
	result := convertJSONToEnvVars(jsonData)

	expected := map[string]interface{}{
		"VAR1": "value1",
		"VAR2": "value2",
	}
	assert.Equal(t, expected, result)

	// Test with empty bytes
	result = convertJSONToEnvVars([]byte{})
	assert.Equal(t, make(map[string]interface{}), result)

	// Test with invalid JSON
	result = convertJSONToEnvVars([]byte("invalid json"))
	assert.Equal(t, make(map[string]interface{}), result)
}
