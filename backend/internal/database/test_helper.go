package database

import (
	"context"
	"fmt"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/require"
)

// TestHelper provides utility functions for database testing
type TestHelper struct {
	DB      *pgxpool.Pool
	Queries *Queries
	ctx     context.Context
}

// NewTestHelper creates a new test helper with database connection
func NewTestHelper(t *testing.T) *TestHelper {
	ctx := context.Background()

	// Get test database URL from environment
	testDBURL := os.Getenv("TEST_DATABASE_URL")
	if testDBURL == "" {
		t.Skip("TEST_DATABASE_URL environment variable not set, skipping database integration tests")
	}

	// Connect to test database
	db, err := pgxpool.New(ctx, testDBURL)
	require.NoError(t, err)

	// Verify connection
	err = db.Ping(ctx)
	require.NoError(t, err)

	return &TestHelper{
		DB:      db,
		Queries: New(db),
		ctx:     ctx,
	}
}

// Close closes the database connection
func (h *TestHelper) Close() {
	if h.DB != nil {
		h.DB.Close()
	}
}

// CleanupAll removes all test data from database
func (h *TestHelper) CleanupAll(t *testing.T) {
	// Delete all test data in proper order
	tables := []string{
		"executions",
		"jobs",
		"refresh_tokens",
		"user_settings",
		"users",
	}

	for _, table := range tables {
		_, err := h.DB.Exec(h.ctx, fmt.Sprintf("DELETE FROM %s WHERE 1=1", table))
		if err != nil {
			t.Logf("Warning: failed to cleanup table %s: %v", table, err)
		}
	}
}

// SetupTestTransaction creates a new transaction for isolated testing
func (h *TestHelper) SetupTestTransaction(t *testing.T) (*TestHelper, func()) {
	tx, err := h.DB.Begin(h.ctx)
	require.NoError(t, err)

	txHelper := &TestHelper{
		DB:      nil, // Don't expose the pool for transaction tests
		Queries: h.Queries.WithTx(tx),
		ctx:     h.ctx,
	}

	rollback := func() {
		err := tx.Rollback(h.ctx)
		if err != nil {
			t.Logf("Warning: failed to rollback transaction: %v", err)
		}
	}

	return txHelper, rollback
}

// Context returns the test context
func (h *TestHelper) Context() context.Context {
	return h.ctx
}
