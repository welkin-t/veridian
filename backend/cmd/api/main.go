package main

import (
	"github.com/nouvadev/veridian/backend/internal/router"
)

func main() {
	r := router.SetupRouter()
	r.Run(":8080")
}
