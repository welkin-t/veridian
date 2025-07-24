package database

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// DatabaseConfig holds database configuration
type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	SSLMode  string
}

// NewConnection creates and configures a new database connection pool
func NewConnection(config DatabaseConfig) (*pgxpool.Pool, error) {
	dsn := fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=%s",
		config.User, config.Password, config.Host, config.Port, config.DBName, config.SSLMode,
	)

	// Configure pool settings
	poolConfig, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database config: %w", err)
	}

	// Configure connection pool - following best practices
	poolConfig.MaxConns = 25                      // hard cap, protect db
	poolConfig.MinConns = 5                       // keep warm conns
	poolConfig.MaxConnLifetime = 5 * time.Minute  // force recycle
	poolConfig.MaxConnIdleTime = 30 * time.Second // idle timeout

	// Create connection pool
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Test the connection
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return pool, nil
}

// HealthCheck performs a database health check
func HealthCheck(ctx context.Context, pool *pgxpool.Pool) error {
	return pool.Ping(ctx)
}
