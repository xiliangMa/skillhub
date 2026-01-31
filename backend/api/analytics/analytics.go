package analytics

import (
	"context"
	"skillhub/config"
	"skillhub/models"
	svcanalytics "skillhub/services/analytics"

	"github.com/gin-gonic/gin"
)

// PlatformStatsResponse 平台统计响应
type PlatformStatsResponse struct {
	TotalUsers     int64 `json:"total_users"`
	TotalSkills    int64 `json:"total_skills"`
	TotalDownloads int64 `json:"total_downloads"`
	ActiveUsers    int64 `json:"active_users"`
	Categories     int64 `json:"categories"`
}

// GetPlatformStats 获取平台统计（公开API）
// @Summary 获取平台统计信息
// @Description 获取平台的公开统计信息，无需认证
// @Tags analytics
// @Accept json
// @Produce json
// @Success 200 {object} PlatformStatsResponse
// @Router /analytics/platform [get]
func GetPlatformStats(c *gin.Context) {
	db := models.GetDB()
	cfg := config.AppConfig

	// 创建分析服务实例
	analyticsService := svcanalytics.NewAnalyticsService(db, cfg)

	// 获取平台统计
	ctx := context.Background()
	platformStats, err := analyticsService.GetPlatformStats(ctx)
	if err != nil {
		c.JSON(500, gin.H{
			"code":    500,
			"message": "Failed to get platform statistics",
			"error":   err.Error(),
		})
		return
	}

	// 获取分类数量
	var categoryCount int64
	db.Model(&models.SkillCategory{}).Count(&categoryCount)

	// 获取总下载量（从skill_analytics表或技能表）
	var totalDownloads int64
	db.Model(&models.Skill{}).Select("COALESCE(SUM(downloads_count), 0)").Scan(&totalDownloads)

	// 获取活跃用户（最近30天有活动的用户）
	var activeUsers int64
	thirtyDaysAgo := "NOW() - INTERVAL '30 days'"
	if db.Dialector.Name() == "postgres" {
		db.Model(&models.User{}).
			Joins("JOIN orders ON users.id = orders.user_id").
			Where("orders.created_at > " + thirtyDaysAgo).
			Group("users.id").
			Count(&activeUsers)
	} else {
		// SQLite或其他数据库的语法
		db.Model(&models.User{}).
			Joins("JOIN orders ON users.id = orders.user_id").
			Where("orders.created_at > datetime('now', '-30 days')").
			Group("users.id").
			Count(&activeUsers)
	}

	// 构建响应
	response := PlatformStatsResponse{
		TotalUsers:     platformStats.TotalUsers,
		TotalSkills:    platformStats.TotalSkills,
		TotalDownloads: totalDownloads,
		ActiveUsers:    activeUsers,
		Categories:     categoryCount,
	}

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data":    response,
	})
}

// UserDashboardStats 用户仪表板统计
type UserDashboardStats struct {
	TotalOrders      int64          `json:"total_orders"`
	TotalSkills      int64          `json:"total_skills"`
	TotalDownloads   int64          `json:"total_downloads"`
	LearningProgress int64          `json:"learning_progress"`
	RecentActivity   []UserActivity `json:"recent_activity"`
}

// UserActivity 用户活动记录
type UserActivity struct {
	ID          string `json:"id"`
	Type        string `json:"type"` // purchase, download, view
	Title       string `json:"title"`
	Description string `json:"description"`
	Timestamp   string `json:"timestamp"`
}

// GetUserDashboard 获取用户仪表板数据
// @Summary 获取用户仪表板统计
// @Description 获取当前用户的仪表板统计数据
// @Tags analytics
// @Accept json
// @Produce json
// @Security Bearer
// @Success 200 {object} UserDashboardStats
// @Router /dashboard/stats [get]
func GetUserDashboard(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{
			"code":    401,
			"message": "Unauthorized",
		})
		return
	}

	db := models.GetDB()

	var stats UserDashboardStats

	// 获取用户订单总数
	db.Model(&models.Order{}).Where("user_id = ?", userID).Count(&stats.TotalOrders)

	// 获取用户拥有的技能数量（通过订单项）
	var skillCount int64
	db.Model(&models.OrderItem{}).
		Joins("JOIN orders ON order_items.order_id = orders.id").
		Where("orders.user_id = ? AND orders.status = ?", userID, "paid").
		Count(&skillCount)
	stats.TotalSkills = skillCount

	// 获取用户总下载量（通过下载记录）
	db.Model(&models.DownloadRecord{}).Where("user_id = ?", userID).Count(&stats.TotalDownloads)

	// 学习进度（基于已购买技能的学习进度）
	// 简化：假设每个技能完成度为50%
	if stats.TotalSkills > 0 {
		stats.LearningProgress = 50 // 50% 平均进度
	}

	// 获取最近活动
	// 最近订单
	var recentOrders []models.Order
	db.Model(&models.Order{}).
		Preload("Items").
		Preload("Items.Skill").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(5).
		Find(&recentOrders)

	for _, order := range recentOrders {
		for _, item := range order.Items {
			if item.Skill != nil {
				activity := UserActivity{
					ID:          order.ID.String(),
					Type:        "purchase",
					Title:       item.Skill.Name,
					Description: "成功购买",
					Timestamp:   order.CreatedAt.Format("2006-01-02 15:04:05"),
				}
				stats.RecentActivity = append(stats.RecentActivity, activity)
			}
		}
	}

	// 最近下载
	var recentDownloads []models.DownloadRecord
	db.Model(&models.DownloadRecord{}).
		Preload("Skill").
		Where("user_id = ?", userID).
		Order("downloaded_at DESC").
		Limit(5).
		Find(&recentDownloads)

	for _, download := range recentDownloads {
		if download.Skill != nil {
			activity := UserActivity{
				ID:          download.ID.String(),
				Type:        "download",
				Title:       download.Skill.Name,
				Description: "下载完成",
				Timestamp:   download.CreatedAt.Format("2006-01-02 15:04:05"),
			}
			stats.RecentActivity = append(stats.RecentActivity, activity)
		}
	}

	// 按时间戳排序
	// 这里简化处理，只取前5个
	if len(stats.RecentActivity) > 5 {
		stats.RecentActivity = stats.RecentActivity[:5]
	}

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data":    stats,
	})
}
