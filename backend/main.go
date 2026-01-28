package main

import (
	"log"
	"skillhub/api/auth"
	"skillhub/config"
	"skillhub/docs"
	"skillhub/middleware"
	"skillhub/models"
	svcauth "skillhub/services/auth"

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

	// 初始化数据库
	if err := models.InitDB(); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	// 初始化OAuth
	svcauth.InitOAuth()

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
			auth.POST("/login", authhandler.Login)
			auth.POST("/register", authhandler.Register)
			auth.GET("/me", middleware.AuthMiddleware(), authhandler.GetMe)
			auth.GET("/oauth/:provider", authhandler.OAuthLogin)
			auth.GET("/callback/github", authhandler.GitHubCallback)
			auth.GET("/callback/google", authhandler.GoogleCallback)
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
			admin.Use(middleware.AuthMiddleware())
			admin.Use(middleware.AdminMiddleware())
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
