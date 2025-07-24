package app

import (
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nouvadev/veridian/backend/internal/auth"
	"github.com/nouvadev/veridian/backend/internal/database"
)

// App holds application dependencies
type App struct {
	DB         *pgxpool.Pool
	Queries    *database.Queries
	JWTManager *auth.JWTManager
}

// NewApp creates a new application instance with dependencies
func NewApp(db *pgxpool.Pool, jwtManager *auth.JWTManager) *App {
	return &App{
		DB:         db,
		Queries:    database.New(db),
		JWTManager: jwtManager,
	}
}
