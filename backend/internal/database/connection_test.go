package database

import (
	"context"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestDatabaseConnection tests basic database connectivity and ping
func TestDatabaseConnection(t *testing.T) {
	// Skip test if no database URL is provided
	dbURL := "postgres://localhost/test"
	if dbURL == "" {
		t.Skip("No database URL provided, skipping connection test")
	}

	ctx := context.Background()

	// Test invalid connection string
	t.Run("Invalid connection string", func(t *testing.T) {
		_, err := pgxpool.New(ctx, "invalid-connection-string")
		assert.Error(t, err)
	})

	// Test connection timeout
	t.Run("Connection timeout", func(t *testing.T) {
		config, err := pgxpool.ParseConfig(dbURL)
		require.NoError(t, err)

		// Set very short timeout for testing
		config.ConnConfig.ConnectTimeout = 1 * time.Nanosecond

		db, err := pgxpool.NewWithConfig(ctx, config)
		if err == nil {
			defer db.Close()

			// Ping should fail due to timeout
			err = db.Ping(ctx)
			assert.Error(t, err)
		}
	})
}

// TestNew tests the New function that creates Queries instance
func TestNew(t *testing.T) {
	// Test with nil db (should not panic)
	t.Run("With nil database", func(t *testing.T) {
		defer func() {
			if r := recover(); r != nil {
				t.Errorf("New() panicked with nil database: %v", r)
			}
		}()

		queries := New(nil)
		assert.NotNil(t, queries)
	})
}
