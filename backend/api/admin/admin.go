package admin

import (
	"context"
	"skillhub/config"
	"skillhub/models"
	"skillhub/services/analytics"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ListSkills 列出所有skills
// @Summary 管理员查看技能列表
// @Tags admin
// @Accept json
// @Produce json
// @Security Bearer
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(20)
// @Param search query string false "搜索关键词"
// @Param sort_by query string false "排序字段" Enums(name,downloads_count,purchases_count,rating,price,created_at,updated_at) default(created_at)
// @Param sort_order query string false "排序方向" Enums(asc,desc) default(desc)
// @Param category_id query string false "分类ID"
// @Param price_type query string false "价格类型" Enums(free,paid)
// @Param is_active query bool false "是否激活"
// @Success 200 {object} map[string]interface{}
// @Router /admin/skills [get]
func ListSkills(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	search := c.Query("search")
	sortBy := c.DefaultQuery("sort_by", "created_at")
	sortOrder := c.DefaultQuery("sort_order", "desc")
	categoryID := c.Query("category_id")
	priceType := c.Query("price_type")
	isActive := c.Query("is_active")

	db := models.GetDB()

	var skills []models.Skill
	var total int64

	query := db.Model(&models.Skill{})

	// 搜索过滤
	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("name ILIKE ? OR description ILIKE ?", searchPattern, searchPattern)
	}

	// 分类过滤
	if categoryID != "" {
		if uid, err := uuid.Parse(categoryID); err == nil {
			query = query.Where("category_id = ?", uid)
		}
	}

	// 价格类型过滤
	if priceType != "" {
		query = query.Where("price_type = ?", priceType)
	}

	// 激活状态过滤
	if isActive != "" {
		if isActive == "true" {
			query = query.Where("is_active = ?", true)
		} else if isActive == "false" {
			query = query.Where("is_active = ?", false)
		}
	}

	// 统计总数
	query.Count(&total)

	// 排序
	validSortFields := map[string]bool{
		"name":             true,
		"downloads_count":  true,
		"purchases_count":  true,
		"rating":          true,
		"price":           true,
		"created_at":      true,
		"updated_at":      true,
	}
	if validSortFields[sortBy] {
		orderClause := sortBy + " " + sortOrder
		query = query.Order(orderClause)
	}

	// 分页
	offset := (page - 1) * pageSize
	query.Preload("Category").Preload("Tags").Offset(offset).Limit(pageSize).Find(&skills)

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data": gin.H{
			"list":       skills,
			"total":      total,
			"page":       page,
			"page_size":  pageSize,
			"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
		},
	})
}

// UpdateSkillRequest 更新技能请求
type UpdateSkillRequest struct {
	Name        *string  `json:"name,omitempty"`
	Description *string  `json:"description,omitempty"`
	CategoryID  *string  `json:"category_id,omitempty"`
	PriceType   *string  `json:"price_type,omitempty"`
	Price       *float64 `json:"price,omitempty"`
	IsActive    *bool    `json:"is_active,omitempty"`
}

// UpdateSkill 更新技能
// @Summary 管理员更新技能
// @Tags admin
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path string true "技能ID"
// @Param request body UpdateSkillRequest true "更新数据"
// @Success 200 {object} map[string]interface{}
// @Router /admin/skills/{id} [put]
func UpdateSkill(c *gin.Context) {
	id := c.Param("id")

	uid, err := uuid.Parse(id)
	if err != nil {
		c.JSON(400, gin.H{
			"code":    400,
			"message": "Invalid skill ID",
		})
		return
	}

	var req UpdateSkillRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	db := models.GetDB()

	var skill models.Skill
	if err := db.First(&skill, "id = ?", uid).Error; err != nil {
		c.JSON(404, gin.H{
			"code":    404,
			"message": "Skill not found",
		})
		return
	}

	// 更新字段
	if req.Name != nil {
		skill.Name = *req.Name
	}
	if req.Description != nil {
		skill.Description = *req.Description
	}
	if req.CategoryID != nil {
		if catID, err := uuid.Parse(*req.CategoryID); err == nil {
			skill.CategoryID = &catID
		}
	}
	if req.PriceType != nil {
		skill.PriceType = models.PriceType(*req.PriceType)
	}
	if req.Price != nil {
		skill.Price = *req.Price
	}
	if req.IsActive != nil {
		skill.IsActive = *req.IsActive
	}

	if err := db.Save(&skill).Error; err != nil {
		c.JSON(500, gin.H{"error": "Failed to update skill"})
		return
	}

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data":    skill,
	})
}

// ListUsers 列出用户
// @Summary 管理员查看用户列表
// @Tags admin
// @Accept json
// @Produce json
// @Security Bearer
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(20)
// @Param search query string false "搜索关键词（邮箱、用户名、姓名）"
// @Param sort_by query string false "排序字段" Enums(email,username,name,created_at,updated_at) default(created_at)
// @Param sort_order query string false "排序方向" Enums(asc,desc) default(desc)
// @Param role query string false "角色" Enums(user,admin)
// @Param is_active query bool false "是否激活"
// @Success 200 {object} map[string]interface{}
// @Router /admin/users [get]
func ListUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	search := c.Query("search")
	sortBy := c.DefaultQuery("sort_by", "created_at")
	sortOrder := c.DefaultQuery("sort_order", "desc")
	role := c.Query("role")
	isActive := c.Query("is_active")

	db := models.GetDB()

	var users []models.User
	var total int64

	query := db.Model(&models.User{})

	// 搜索过滤
	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("email ILIKE ? OR username ILIKE ? OR name ILIKE ?", searchPattern, searchPattern, searchPattern)
	}

	// 角色过滤
	if role != "" {
		query = query.Where("role = ?", role)
	}

	// 激活状态过滤
	if isActive != "" {
		if isActive == "true" {
			query = query.Where("is_active = ?", true)
		} else if isActive == "false" {
			query = query.Where("is_active = ?", false)
		}
	}

	// 统计总数
	query.Count(&total)

	// 排序
	validSortFields := map[string]bool{
		"email":      true,
		"username":   true,
		"name":       true,
		"created_at": true,
		"updated_at": true,
	}
	if validSortFields[sortBy] {
		orderClause := sortBy + " " + sortOrder
		query = query.Order(orderClause)
	}

	// 分页
	offset := (page - 1) * pageSize
	query.Preload("Profile").Offset(offset).Limit(pageSize).Find(&users)

	// 清除敏感信息
	for i := range users {
		users[i].PasswordHash = ""
	}

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data": gin.H{
			"list":       users,
			"total":      total,
			"page":       page,
			"page_size":  pageSize,
			"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
		},
	})
}

// ListOrders 列出订单
// @Summary 管理员查看所有订单
// @Tags admin
// @Accept json
// @Produce json
// @Security Bearer
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(20)
// @Param search query string false "搜索关键词（订单号、用户邮箱）"
// @Param sort_by query string false "排序字段" Enums(order_no,total_amount,status,created_at) default(created_at)
// @Param sort_order query string false "排序方向" Enums(asc,desc) default(desc)
// @Param status query string false "订单状态" Enums(pending,paid,failed,refunded)
// @Param user_id query string false "用户ID"
// @Success 200 {object} map[string]interface{}
// @Router /admin/orders [get]
func ListOrders(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	search := c.Query("search")
	sortBy := c.DefaultQuery("sort_by", "created_at")
	sortOrder := c.DefaultQuery("sort_order", "desc")
	status := c.Query("status")
	userID := c.Query("user_id")

	db := models.GetDB()

	var orders []models.Order
	var total int64

	query := db.Model(&models.Order{})

	// 搜索过滤
	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Joins("LEFT JOIN users ON users.id = orders.user_id").
			Where("orders.order_no ILIKE ? OR users.email ILIKE ?", searchPattern, searchPattern)
	}

	// 状态过滤
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// 用户过滤
	if userID != "" {
		if uid, err := uuid.Parse(userID); err == nil {
			query = query.Where("user_id = ?", uid)
		}
	}

	// 统计总数
	if search != "" {
		// 如果有搜索条件，需要使用相同的JOIN来统计
		subQuery := db.Model(&models.Order{}).
			Select("orders.*").
			Joins("LEFT JOIN users ON users.id = orders.user_id").
			Where("orders.order_no ILIKE ? OR users.email ILIKE ?", "%"+search+"%", "%"+search+"%")
		subQuery.Count(&total)
	} else {
		query.Count(&total)
	}

	// 排序
	validSortFields := map[string]bool{
		"order_no":     true,
		"total_amount": true,
		"status":       true,
		"created_at":   true,
	}
	if validSortFields[sortBy] {
		orderClause := "orders." + sortBy + " " + sortOrder
		query = query.Order(orderClause)
	}

	// 分页
	offset := (page - 1) * pageSize
	query.Preload("Items").Preload("Items.Skill").Preload("User").
		Offset(offset).
		Limit(pageSize).
		Find(&orders)

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data": gin.H{
			"list":       orders,
			"total":      total,
			"page":       page,
			"page_size":  pageSize,
			"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
		},
	})
}

// Order 订单响应
type Order struct {
	ID           string  `json:"id"`
	OrderNo      string  `json:"order_no"`
	UserEmail    string  `json:"user_email"`
	TotalAmount  float64 `json:"total_amount"`
	Status       string  `json:"status"`
	CreatedAt    string  `json:"created_at"`
}

// AnalyticsData 统计数据
type AnalyticsData struct {
	TotalUsers       int64   `json:"total_users"`
	TotalSkills      int64   `json:"total_skills"`
	TotalOrders      int64   `json:"total_orders"`
	TotalRevenue     float64 `json:"total_revenue"`
	ActiveSkills     int64   `json:"active_skills"`
	TodayOrders      int64   `json:"today_orders"`
	TodayRevenue     float64 `json:"today_revenue"`
	PaidSkills       int64   `json:"paid_skills"`
	FreeSkills       int64   `json:"free_skills"`
	RecentOrders     []Order `json:"recent_orders"`
}

// GetAnalytics 获取统计信息
// @Summary 获取统计数据
// @Tags admin
// @Accept json
// @Produce json
// @Security Bearer
// @Success 200 {object} AnalyticsData
// @Router /admin/analytics [get]
func GetAnalytics(c *gin.Context) {
	db := models.GetDB()
	cfg := config.AppConfig

	// 创建分析服务实例
	analyticsService := analytics.NewAnalyticsService(db, cfg)

	// 获取平台统计
	ctx := context.Background()
	platformStats, err := analyticsService.GetPlatformStats(ctx)
	if err != nil {
		c.JSON(500, gin.H{
			"code":    500,
			"message": "Failed to get analytics data",
			"error":   err.Error(),
		})
		return
	}

	// 转换为API响应格式
	var analyticsData AnalyticsData
	analyticsData.TotalUsers = platformStats.TotalUsers
	analyticsData.TotalSkills = platformStats.TotalSkills
	analyticsData.ActiveSkills = platformStats.ActiveSkills
	analyticsData.PaidSkills = platformStats.PaidSkills
	analyticsData.FreeSkills = platformStats.FreeSkills
	analyticsData.TotalOrders = platformStats.TotalOrders
	analyticsData.TotalRevenue = platformStats.TotalRevenue
	analyticsData.TodayOrders = platformStats.TodayOrders
	analyticsData.TodayRevenue = platformStats.TodayRevenue

	// 最近订单
	for _, order := range platformStats.RecentOrders {
		analyticsData.RecentOrders = append(analyticsData.RecentOrders, Order{
			ID:          order.ID,
			OrderNo:     order.OrderNo,
			UserEmail:   order.UserEmail,
			TotalAmount: order.TotalAmount,
			Status:      order.Status,
			CreatedAt:   order.CreatedAt,
		})
	}

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data":    analyticsData,
	})
}

// GetDailyAnalytics 获取每日统计数据
// @Summary 获取每日统计数据
// @Description 获取指定日期的统计数据，如果未指定日期则使用今天
// @Tags admin
// @Accept json
// @Produce json
// @Security Bearer
// @Param date query string false "日期 (格式: YYYY-MM-DD)"
// @Success 200 {object} gin.H
// @Router /admin/analytics/daily [get]
func GetDailyAnalytics(c *gin.Context) {
	db := models.GetDB()
	cfg := config.AppConfig
	analyticsService := analytics.NewAnalyticsService(db, cfg)

	// 解析日期参数，默认为今天
	dateStr := c.Query("date")
	var date time.Time
	if dateStr == "" {
		date = time.Now()
	} else {
		var err error
		date, err = time.Parse("2006-01-02", dateStr)
		if err != nil {
			c.JSON(400, gin.H{
				"code":    400,
				"message": "Invalid date format, expected YYYY-MM-DD",
				"error":   err.Error(),
			})
			return
		}
	}

	ctx := context.Background()
	dailyStats, err := analyticsService.GetDailyStats(ctx, date)
	if err != nil {
		c.JSON(500, gin.H{
			"code":    500,
			"message": "Failed to get daily analytics",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data":    dailyStats,
	})
}

// GetRevenueAnalytics 获取收入统计数据
// @Summary 获取收入统计数据
// @Description 获取指定时间范围的收入统计数据
// @Tags admin
// @Accept json
// @Produce json
// @Security Bearer
// @Param start_date query string true "开始日期 (格式: YYYY-MM-DD)"
// @Param end_date query string true "结束日期 (格式: YYYY-MM-DD)"
// @Success 200 {object} gin.H
// @Router /admin/analytics/revenue [get]
func GetRevenueAnalytics(c *gin.Context) {
	db := models.GetDB()
	cfg := config.AppConfig
	analyticsService := analytics.NewAnalyticsService(db, cfg)

	// 解析日期参数
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	if startDateStr == "" || endDateStr == "" {
		c.JSON(400, gin.H{
			"code":    400,
			"message": "start_date and end_date are required",
		})
		return
	}

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		c.JSON(400, gin.H{
			"code":    400,
			"message": "Invalid start_date format, expected YYYY-MM-DD",
			"error":   err.Error(),
		})
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		c.JSON(400, gin.H{
			"code":    400,
			"message": "Invalid end_date format, expected YYYY-MM-DD",
			"error":   err.Error(),
		})
		return
	}

	// 结束日期设置为当天结束时间
	endDate = endDate.Add(24*time.Hour - time.Second)

	ctx := context.Background()
	revenueStats, err := analyticsService.GetRevenueStats(ctx, startDate, endDate)
	if err != nil {
		c.JSON(500, gin.H{
			"code":    500,
			"message": "Failed to get revenue analytics",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data":    revenueStats,
	})
}

// GetTopSkillsAnalytics 获取技能排行榜
// @Summary 获取技能排行榜
// @Description 获取热门技能排行榜，可按浏览量、下载量、购买量、收入等排序
// @Tags admin
// @Accept json
// @Produce json
// @Security Bearer
// @Param limit query int false "返回数量限制" default(10)
// @Param period query string false "统计周期" Enums(day,week,month,all) default(all)
// @Param sort_by query string false "排序字段" Enums(views,downloads,purchases,revenue,growth) default(downloads)
// @Success 200 {object} gin.H
// @Router /admin/analytics/top-skills [get]
func GetTopSkillsAnalytics(c *gin.Context) {
	db := models.GetDB()
	cfg := config.AppConfig
	analyticsService := analytics.NewAnalyticsService(db, cfg)

	// 解析参数
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	period := c.DefaultQuery("period", "all")
	// 注意：分析服务目前只支持一个简单的GetTopSkills，我们需要调整实现
	// 暂时使用默认实现

	ctx := context.Background()
	topSkills, err := analyticsService.GetTopSkills(ctx, limit, period)
	if err != nil {
		c.JSON(500, gin.H{
			"code":    500,
			"message": "Failed to get top skills analytics",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data":    topSkills,
	})
}

// GetCategoryAnalytics 获取分类统计数据
// @Summary 获取分类统计数据
// @Description 获取各分类的统计信息
// @Tags admin
// @Accept json
// @Produce json
// @Security Bearer
// @Success 200 {object} gin.H
// @Router /admin/analytics/categories [get]
func GetCategoryAnalytics(c *gin.Context) {
	db := models.GetDB()
	cfg := config.AppConfig
	analyticsService := analytics.NewAnalyticsService(db, cfg)

	ctx := context.Background()
	categoryStats, err := analyticsService.GetCategoryStats(ctx)
	if err != nil {
		c.JSON(500, gin.H{
			"code":    500,
			"message": "Failed to get category analytics",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data":    categoryStats,
	})
}
