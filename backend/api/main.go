package main

import (
	"github.com/gin-gonic/gin"
)

func healthHandler(c *gin.Context) {
	c.JSON(200, gin.H{"status": "ok"})
}

func setupRouter() *gin.Engine {
	r := gin.Default()
	r.GET("/health", healthHandler)
	return r
}

func main() {
	r := setupRouter()
	r.Run(":8080")
}
