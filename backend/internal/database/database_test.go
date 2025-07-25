package database

import (
	"context"
	"encoding/json"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
)

// DatabaseTestSuite defines the test suite for database operations
type DatabaseTestSuite struct {
	suite.Suite
	db      *pgxpool.Pool
	queries *Queries
	ctx     context.Context
}

// SetupSuite runs once before all tests
func (suite *DatabaseTestSuite) SetupSuite() {
	suite.ctx = context.Background()

	// Use test database URL from environment or default
	testDBURL := os.Getenv("TEST_DATABASE_URL")
	if testDBURL == "" {
		suite.T().Skip("TEST_DATABASE_URL environment variable not set, skipping database tests")
		return
	}

	db, err := pgxpool.New(suite.ctx, testDBURL)
	require.NoError(suite.T(), err)

	err = db.Ping(suite.ctx)
	require.NoError(suite.T(), err)

	suite.db = db
	suite.queries = New(db)
}

// TearDownSuite runs once after all tests
func (suite *DatabaseTestSuite) TearDownSuite() {
	if suite.db != nil {
		suite.db.Close()
	}
}

// SetupTest runs before each test
func (suite *DatabaseTestSuite) SetupTest() {
	if suite.db == nil {
		suite.T().Skip("Database not available for testing")
		return
	}

	// Clean up test data before each test
	suite.cleanupTestData()
}

// TearDownTest runs after each test
func (suite *DatabaseTestSuite) TearDownTest() {
	if suite.db == nil {
		return
	}

	// Clean up test data after each test
	suite.cleanupTestData()
}

// cleanupTestData removes all test data from database
func (suite *DatabaseTestSuite) cleanupTestData() {
	testUserID := suite.getTestUserID()

	// Delete in reverse order of dependencies
	suite.db.Exec(suite.ctx, "DELETE FROM executions WHERE job_id IN (SELECT id FROM jobs WHERE owner_id = $1)", testUserID)
	suite.db.Exec(suite.ctx, "DELETE FROM jobs WHERE owner_id = $1", testUserID)
	suite.db.Exec(suite.ctx, "DELETE FROM refresh_tokens WHERE user_id = $1", testUserID)
	suite.db.Exec(suite.ctx, "DELETE FROM users WHERE id = $1", testUserID)
}

// getTestUserID returns a consistent test user ID
func (suite *DatabaseTestSuite) getTestUserID() uuid.UUID {
	return uuid.MustParse("12345678-1234-5678-9012-123456789012")
}

// TestUserOperations tests user-related database operations
func (suite *DatabaseTestSuite) TestUserOperations() {
	testEmail := "test@example.com"
	testPasswordHash := "$2a$10$hashedpasswordexample"

	// Test CreateUser
	user, err := suite.queries.CreateUser(suite.ctx, CreateUserParams{
		Email:          testEmail,
		HashedPassword: testPasswordHash,
		EmailVerified:  false,
		IsActive:       true,
	})
	require.NoError(suite.T(), err)
	assert.Equal(suite.T(), testEmail, user.Email)
	assert.Equal(suite.T(), testPasswordHash, user.HashedPassword)
	assert.False(suite.T(), user.EmailVerified)
	assert.True(suite.T(), user.IsActive)
	assert.False(suite.T(), user.CreatedAt.IsZero())
	assert.False(suite.T(), user.UpdatedAt.IsZero())

	// Store the created user ID for cleanup
	createdUserID := user.ID

	// Test GetUserByEmail
	foundUser, err := suite.queries.GetUserByEmail(suite.ctx, testEmail)
	require.NoError(suite.T(), err)
	assert.Equal(suite.T(), createdUserID, foundUser.ID)
	assert.Equal(suite.T(), testEmail, foundUser.Email)
	assert.Equal(suite.T(), testPasswordHash, foundUser.HashedPassword)

	// Test GetUserByID
	foundUserByID, err := suite.queries.GetUserByID(suite.ctx, createdUserID)
	require.NoError(suite.T(), err)
	assert.Equal(suite.T(), createdUserID, foundUserByID.ID)
	assert.Equal(suite.T(), testEmail, foundUserByID.Email)

	// Test getting non-existent user
	_, err = suite.queries.GetUserByEmail(suite.ctx, "nonexistent@example.com")
	assert.Error(suite.T(), err)

	// Clean up manually created user
	suite.db.Exec(suite.ctx, "DELETE FROM users WHERE id = $1", createdUserID)
}

// TestJobOperations tests job-related database operations
func (suite *DatabaseTestSuite) TestJobOperations() {
	testEmail := "test@example.com"
	testPasswordHash := "$2a$10$hashedpasswordexample"

	// First create a user
	user, err := suite.queries.CreateUser(suite.ctx, CreateUserParams{
		Email:          testEmail,
		HashedPassword: testPasswordHash,
		EmailVerified:  false,
		IsActive:       true,
	})
	require.NoError(suite.T(), err)
	createdUserID := user.ID

	// Test CreateJob
	testImageURI := "nginx:latest"
	testEnvVars := []byte(`{"ENV": "test", "DEBUG": "true"}`)
	testDelayTolerance := int32(24) // 24 hours

	job, err := suite.queries.CreateJob(suite.ctx, CreateJobParams{
		OwnerID:             createdUserID,
		ImageUri:            testImageURI,
		EnvVars:             testEnvVars,
		DelayToleranceHours: testDelayTolerance,
	})
	require.NoError(suite.T(), err)
	assert.Equal(suite.T(), createdUserID, job.OwnerID)
	assert.Equal(suite.T(), testImageURI, job.ImageUri)
	assert.Equal(suite.T(), testEnvVars, job.EnvVars)
	assert.Equal(suite.T(), testDelayTolerance, job.DelayToleranceHours)
	assert.False(suite.T(), job.CreatedAt.IsZero())
	assert.False(suite.T(), job.UpdatedAt.IsZero())

	// Test GetJobsByOwner
	jobs, err := suite.queries.GetJobsByOwner(suite.ctx, createdUserID)
	require.NoError(suite.T(), err)
	assert.Len(suite.T(), jobs, 1)
	assert.Equal(suite.T(), job.ID, jobs[0].ID)

	// Test GetJob
	foundJob, err := suite.queries.GetJob(suite.ctx, GetJobParams{
		ID:      job.ID,
		OwnerID: createdUserID,
	})
	require.NoError(suite.T(), err)
	assert.Equal(suite.T(), job.ID, foundJob.ID)
	assert.Equal(suite.T(), testImageURI, foundJob.ImageUri)

	// Test UpdateJob
	newImageURI := "python:3.9"
	newEnvVars := []byte(`{"ENV": "production", "DEBUG": "false"}`)
	newDelayTolerance := int32(48) // 48 hours

	updatedJob, err := suite.queries.UpdateJob(suite.ctx, UpdateJobParams{
		ID:                  job.ID,
		OwnerID:             createdUserID,
		ImageUri:            newImageURI,
		EnvVars:             newEnvVars,
		DelayToleranceHours: newDelayTolerance,
	})
	require.NoError(suite.T(), err)
	assert.Equal(suite.T(), job.ID, updatedJob.ID)
	assert.Equal(suite.T(), newImageURI, updatedJob.ImageUri)
	assert.Equal(suite.T(), newEnvVars, updatedJob.EnvVars)
	assert.Equal(suite.T(), newDelayTolerance, updatedJob.DelayToleranceHours)

	// Test DeleteJob
	err = suite.queries.DeleteJob(suite.ctx, DeleteJobParams{
		ID:      job.ID,
		OwnerID: createdUserID,
	})
	require.NoError(suite.T(), err)

	// Verify job is deleted
	_, err = suite.queries.GetJob(suite.ctx, GetJobParams{
		ID:      job.ID,
		OwnerID: createdUserID,
	})
	assert.Error(suite.T(), err)

	// Clean up user
	suite.db.Exec(suite.ctx, "DELETE FROM users WHERE id = $1", createdUserID)
}

// TestExecutionOperations tests execution-related database operations
func (suite *DatabaseTestSuite) TestExecutionOperations() {
	testEmail := "test@example.com"
	testPasswordHash := "$2a$10$hashedpasswordexample"

	// Create user and job first
	user, err := suite.queries.CreateUser(suite.ctx, CreateUserParams{
		Email:          testEmail,
		HashedPassword: testPasswordHash,
		EmailVerified:  false,
		IsActive:       true,
	})
	require.NoError(suite.T(), err)
	createdUserID := user.ID

	job, err := suite.queries.CreateJob(suite.ctx, CreateJobParams{
		OwnerID:             createdUserID,
		ImageUri:            "nginx:latest",
		EnvVars:             []byte(`{"ENV": "test"}`),
		DelayToleranceHours: 24,
	})
	require.NoError(suite.T(), err)

	// Test CreateExecution
	testStatus := ExecutionStatusPending

	execution, err := suite.queries.CreateExecution(suite.ctx, CreateExecutionParams{
		JobID:  job.ID,
		Status: testStatus,
	})
	require.NoError(suite.T(), err)
	assert.Equal(suite.T(), job.ID, execution.JobID)
	assert.Equal(suite.T(), testStatus, execution.Status)
	assert.False(suite.T(), execution.CreatedAt.IsZero())

	// Test UpdateExecutionStatus
	newStatus := ExecutionStatusRunning

	updatedExecution, err := suite.queries.UpdateExecutionStatus(suite.ctx, UpdateExecutionStatusParams{
		ID:     execution.ID,
		Status: newStatus,
	})
	require.NoError(suite.T(), err)
	assert.Equal(suite.T(), execution.ID, updatedExecution.ID)
	assert.Equal(suite.T(), newStatus, updatedExecution.Status)

	// Test GetExecutionsByJobID
	executions, err := suite.queries.GetExecutionsByJobID(suite.ctx, job.ID)
	require.NoError(suite.T(), err)
	assert.Len(suite.T(), executions, 1)
	assert.Equal(suite.T(), execution.ID, executions[0].ID)

	// Clean up
	suite.db.Exec(suite.ctx, "DELETE FROM executions WHERE id = $1", execution.ID)
	suite.db.Exec(suite.ctx, "DELETE FROM jobs WHERE id = $1", job.ID)
	suite.db.Exec(suite.ctx, "DELETE FROM users WHERE id = $1", createdUserID)
}

// TestRefreshTokenOperations tests refresh token database operations
func (suite *DatabaseTestSuite) TestRefreshTokenOperations() {
	testEmail := "test@example.com"
	testPasswordHash := "$2a$10$hashedpasswordexample"

	// Create user first
	user, err := suite.queries.CreateUser(suite.ctx, CreateUserParams{
		Email:          testEmail,
		HashedPassword: testPasswordHash,
		EmailVerified:  false,
		IsActive:       true,
	})
	require.NoError(suite.T(), err)
	createdUserID := user.ID

	// Test CreateRefreshToken
	testTokenHash := "sha256hashofthetokengoeshere"
	expiresAt := time.Now().Add(7 * 24 * time.Hour)

	refreshToken, err := suite.queries.CreateRefreshToken(suite.ctx, CreateRefreshTokenParams{
		UserID:    createdUserID,
		TokenHash: testTokenHash,
		ExpiresAt: pgtype.Timestamptz{Time: expiresAt, Valid: true},
		UserAgent: nil,
		IpAddress: nil,
	})
	require.NoError(suite.T(), err)
	assert.Equal(suite.T(), createdUserID, refreshToken.UserID)
	assert.Equal(suite.T(), testTokenHash, refreshToken.TokenHash)
	assert.False(suite.T(), refreshToken.IsRevoked)

	// Test GetRefreshToken
	foundToken, err := suite.queries.GetRefreshToken(suite.ctx, testTokenHash)
	require.NoError(suite.T(), err)
	assert.Equal(suite.T(), refreshToken.ID, foundToken.ID)
	assert.Equal(suite.T(), createdUserID, foundToken.UserID)
	assert.Equal(suite.T(), testTokenHash, foundToken.TokenHash)

	// Test RevokeRefreshToken
	err = suite.queries.RevokeRefreshToken(suite.ctx, testTokenHash)
	require.NoError(suite.T(), err)

	// Verify token is revoked
	revokedToken, err := suite.queries.GetRefreshToken(suite.ctx, testTokenHash)
	require.NoError(suite.T(), err)
	assert.True(suite.T(), revokedToken.IsRevoked)

	// Clean up
	suite.db.Exec(suite.ctx, "DELETE FROM refresh_tokens WHERE id = $1", refreshToken.ID)
	suite.db.Exec(suite.ctx, "DELETE FROM users WHERE id = $1", createdUserID)
}

// TestTransactionOperations tests database operations with transactions
func (suite *DatabaseTestSuite) TestTransactionOperations() {
	testEmail := "test@example.com"
	testPasswordHash := "$2a$10$hashedpasswordexample"

	// Test transaction rollback
	tx, err := suite.db.Begin(suite.ctx)
	require.NoError(suite.T(), err)

	txQueries := suite.queries.WithTx(tx)

	// Create user in transaction
	user, err := txQueries.CreateUser(suite.ctx, CreateUserParams{
		Email:          testEmail,
		HashedPassword: testPasswordHash,
		EmailVerified:  false,
		IsActive:       true,
	})
	require.NoError(suite.T(), err)
	createdUserID := user.ID

	// Rollback transaction
	err = tx.Rollback(suite.ctx)
	require.NoError(suite.T(), err)

	// Verify user was not created (due to rollback)
	_, err = suite.queries.GetUserByID(suite.ctx, createdUserID)
	assert.Error(suite.T(), err)

	// Test transaction commit
	tx, err = suite.db.Begin(suite.ctx)
	require.NoError(suite.T(), err)

	txQueries = suite.queries.WithTx(tx)

	// Create user in transaction
	user, err = txQueries.CreateUser(suite.ctx, CreateUserParams{
		Email:          testEmail,
		HashedPassword: testPasswordHash,
		EmailVerified:  false,
		IsActive:       true,
	})
	require.NoError(suite.T(), err)
	createdUserID = user.ID

	// Commit transaction
	err = tx.Commit(suite.ctx)
	require.NoError(suite.T(), err)

	// Verify user was created (due to commit)
	foundUser, err := suite.queries.GetUserByID(suite.ctx, createdUserID)
	require.NoError(suite.T(), err)
	assert.Equal(suite.T(), createdUserID, foundUser.ID)
	assert.Equal(suite.T(), testEmail, foundUser.Email)

	// Clean up
	suite.db.Exec(suite.ctx, "DELETE FROM users WHERE id = $1", createdUserID)
}

// TestValidationAndConstraints tests database constraints and validation
func (suite *DatabaseTestSuite) TestValidationAndConstraints() {
	// Test unique email constraint
	testEmail := "unique@example.com"
	testPasswordHash := "$2a$10$hashedpasswordexample"

	// Create first user
	user1, err := suite.queries.CreateUser(suite.ctx, CreateUserParams{
		Email:          testEmail,
		HashedPassword: testPasswordHash,
		EmailVerified:  false,
		IsActive:       true,
	})
	require.NoError(suite.T(), err)

	// Try to create second user with same email (should fail)
	_, err = suite.queries.CreateUser(suite.ctx, CreateUserParams{
		Email:          testEmail,
		HashedPassword: testPasswordHash,
		EmailVerified:  false,
		IsActive:       true,
	})
	assert.Error(suite.T(), err)

	// Test job environment variables JSON validation
	validJSON := []byte(`{"ENV": "test", "PORT": "8080"}`)
	var parsedJSON map[string]interface{}
	err = json.Unmarshal(validJSON, &parsedJSON)
	require.NoError(suite.T(), err)

	job, err := suite.queries.CreateJob(suite.ctx, CreateJobParams{
		OwnerID:             user1.ID,
		ImageUri:            "nginx:latest",
		EnvVars:             validJSON,
		DelayToleranceHours: 24,
	})
	require.NoError(suite.T(), err)
	assert.Equal(suite.T(), validJSON, job.EnvVars)

	// Clean up
	suite.db.Exec(suite.ctx, "DELETE FROM jobs WHERE id = $1", job.ID)
	suite.db.Exec(suite.ctx, "DELETE FROM users WHERE id = $1", user1.ID)
}

// TestDatabaseSuite runs the test suite
func TestDatabaseSuite(t *testing.T) {
	suite.Run(t, new(DatabaseTestSuite))
}
