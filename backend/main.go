package main

import (
	"log"
	"skillhub/api/admin"
	authhandler "skillhub/api/auth"
	"skillhub/api/payment"
	"skillhub/api/skills"
	"skillhub/config"
	_ "skillhub/docs"
	"skillhub/middleware"
	"skillhub/mock"
	"skillhub/models"
	svcauth "skillhub/services/auth"
	// "skillhub/services/payment"
	// svcScheduler "skillhub/services/scheduler"

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

	// 初始化mock数据
	if err := mock.SeedData(); err != nil {
		log.Printf("Warning: Failed to seed mock data: %v", err)
	}

	// 初始化OAuth
	svcauth.InitOAuth()

	// 初始化支付服务
	// svcpayment.InitPayment()

	// 初始化默认定时任务
	// svcScheduler.InitDefaultTasks()
	// svcScheduler.InitScheduler()

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
			auth.GET("/callback/wechat", authhandler.WeChatCallback)
			auth.GET("/callback/feishu", authhandler.FeishuCallback)
			auth.GET("/callback/xiaohongshu", authhandler.XiaohongshuCallback)
		}

		skillsGroup := v1.Group("/skills")
		{
			skillsGroup.GET("", skills.ListSkills)
			skillsGroup.GET("/:id", skills.GetSkill)
			skillsGroup.GET("/:id/download", skills.DownloadSkill)
			skillsGroup.POST("/:id/purchase", middleware.AuthMiddleware(), skills.PurchaseSkill)
			skillsGroup.GET("/categories", skills.GetCategories)
			skillsGroup.GET("/hot", skills.GetHotSkills)
			skillsGroup.GET("/trending", skills.GetTrendingSkills)
		}

		users := v1.Group("/users")
		{
			users.Use(middleware.AuthMiddleware())
			// users routes will be added later
		}

		paymentGroup := v1.Group("/payment")
		{
			paymentGroup.Use(middleware.AuthMiddleware())
			paymentGroup.POST("/orders", payment.CreateOrder)
			paymentGroup.GET("/orders", payment.GetOrders)
			paymentGroup.POST("/payment/orders/:id/pay", payment.GetPaymentURL)
			paymentGroup.POST("/callback/alipay", payment.AlipayCallback)
		}

		adminGroup := v1.Group("/admin")
		{
			adminGroup.Use(middleware.AuthMiddleware())
			adminGroup.Use(middleware.AdminMiddleware())
			adminGroup.GET("/skills", admin.ListSkills)
			adminGroup.PUT("/skills/:id", admin.UpdateSkill)
			adminGroup.GET("/users", admin.ListUsers)
			adminGroup.GET("/orders", admin.ListOrders)
			adminGroup.GET("/analytics", admin.GetAnalytics)
		}
	}

	// Swagger documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	log.Printf("Starting server on port %s in %s mode", config.AppConfig.Server.Port, config.AppConfig.Server.Mode)
	if err := router.Run(":" + config.AppConfig.Server.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
