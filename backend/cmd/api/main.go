package main

import (
	"log"
	"os"
	"strconv"
	"time"

	"github.com/nouvadev/veridian/backend/internal/app"
	"github.com/nouvadev/veridian/backend/internal/auth"
	"github.com/nouvadev/veridian/backend/internal/database"
	"github.com/nouvadev/veridian/backend/internal/router"
)

func main() {
	// JWT configuration from environment variables
	jwtSecret := getEnv("JWT_SECRET", "your-super-secret-jwt-key-change-this-in-production")
	if jwtSecret == "your-super-secret-jwt-key-change-this-in-production" {
		log.Println("WARNING: Using default JWT secret! Set JWT_SECRET environment variable in production.")
	}

	// Database configuration from environment variables
	config := database.DatabaseConfig{
		Host:     getEnv("DB_HOST", "localhost"),
		Port:     getEnvInt("DB_PORT", 5432),
		User:     getEnv("DB_USER", "postgres"),
		Password: getEnv("DB_PASSWORD", ""),
		DBName:   getEnv("DB_NAME", "veridian"),
		SSLMode:  getEnv("DB_SSL_MODE", "disable"),
	}

	// Create database connection
	db, err := database.NewConnection(config)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	log.Println("Successfully connected to database")

	// Create JWT manager
	jwtManager := auth.NewJWTManager(
		jwtSecret,
		"veridian-api",    // issuer
		"veridian-client", // audience
		15*time.Minute,    // access token TTL
		7*24*time.Hour,    // refresh token TTL (7 days)
	)

	// Create application with dependencies
	app := app.NewApp(db, jwtManager)

	// Setup router with app dependencies
	r := router.SetupRouter(app)

	// Start server
	port := getEnv("PORT", "8080")
	log.Printf("Server starting on port %s", port)

	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

// Helper functions for environment variables
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}
