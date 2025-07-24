package router

import (
	"github.com/gin-gonic/gin"
	"github.com/nouvadev/veridian/backend/internal/handlers"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	// Health check route
	r.GET("/health", handlers.HealthHandler)

	// Job routes
	r.POST("/jobs", handlers.CreateJob)
	r.GET("/jobs", handlers.GetJobs)
	r.GET("/jobs/:id", handlers.GetJob)
	r.PUT("/jobs/:id", handlers.UpdateJob)
	r.DELETE("/jobs/:id", handlers.DeleteJob)

	return r
}
