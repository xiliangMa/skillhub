package main

import (
	"log"
	"skillhub/config"
	"skillhub/docs"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "github.com/lib/pq"
)

// @title Skills商店SaaS平台API
// @version 1.0
// @description Skills商店SaaS平台后端API文档
// @host localhost:8080
// @BasePath /api/v1
func main() {
	config.AppConfig = config.LoadConfig()

	if config.AppConfig.Server.Mode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	// CORS middleware
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API v1
	v1 := router.Group("/api/v1")
	{
		auth := v1.Group("/auth")
		{
			// auth routes will be added later
		}

		skills := v1.Group("/skills")
		{
			// skills routes will be added later
		}

		users := v1.Group("/users")
		{
			// users routes will be added later
		}

		admin := v1.Group("/admin")
		{
			// admin routes will be added later
		}
	}

	// Swagger documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	log.Printf("Starting server on port %s in %s mode", config.AppConfig.Server.Port, config.AppConfig.Server.Mode)
	if err := router.Run(":" + config.AppConfig.Server.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
