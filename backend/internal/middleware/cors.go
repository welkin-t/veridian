package middleware

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// CORSMiddleware configures CORS for the API
func CORSMiddleware() gin.HandlerFunc {
	config := cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173"}, // Add your frontend URLs
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}

	return cors.New(config)
}
