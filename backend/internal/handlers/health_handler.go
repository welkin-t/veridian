package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/nouvadev/veridian/backend/internal/app"
	"github.com/nouvadev/veridian/backend/internal/database"
)

// HealthHandler handles health check requests
func HealthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// HealthHandlerWithDB handles health check requests including database
func HealthHandlerWithDB(c *gin.Context, app *app.App) {
	ctx := c.Request.Context()

	// Check database health
	if err := database.HealthCheck(ctx, app.DB); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "unhealthy",
			"error":  "database connection failed",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":   "healthy",
		"database": "connected",
	})
}
