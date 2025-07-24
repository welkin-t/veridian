package router

import (
	"github.com/gin-gonic/gin"
	"github.com/nouvadev/veridian/backend/internal/app"
	"github.com/nouvadev/veridian/backend/internal/handlers"
	"github.com/nouvadev/veridian/backend/internal/middleware"
)

func SetupRouter(app *app.App) *gin.Engine {
	r := gin.Default()

	// Add CORS middleware
	r.Use(middleware.CORSMiddleware())

	// Health check route (public)
	r.GET("/health", handlers.HealthHandler)

	// Public auth routes
	auth := r.Group("/auth")
	{
		auth.POST("/register", func(c *gin.Context) { handlers.RegisterHandler(c, app) })
		auth.POST("/login", func(c *gin.Context) { handlers.LoginHandler(c, app) })
		auth.POST("/refresh", func(c *gin.Context) { handlers.RefreshTokenHandler(c, app) })
		auth.POST("/logout", func(c *gin.Context) { handlers.LogoutHandler(c, app) })
	}

	// Protected API routes
	api := r.Group("/api/v1")
	api.Use(middleware.JWTAuthMiddleware(app.JWTManager))
	{
		// Auth profile routes
		api.GET("/auth/profile", func(c *gin.Context) { handlers.GetProfileHandler(c, app) })
		api.POST("/auth/change-password", func(c *gin.Context) { handlers.ChangePasswordHandler(c, app) })

		// Job routes - all protected
		api.POST("/jobs", func(c *gin.Context) { handlers.CreateJob(c, app) })
		api.GET("/jobs", func(c *gin.Context) { handlers.GetJobs(c, app) })
		api.GET("/jobs/:id", func(c *gin.Context) { handlers.GetJob(c, app) })
		api.PUT("/jobs/:id", func(c *gin.Context) { handlers.UpdateJob(c, app) })
		api.DELETE("/jobs/:id", func(c *gin.Context) { handlers.DeleteJob(c, app) })
	}

	return r
}
