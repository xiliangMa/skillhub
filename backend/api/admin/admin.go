package admin

import (
	"skillhub/models"
	"strconv"

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
// @Success 200 {object} map[string]interface{}
// @Router /admin/skills [get]
func ListSkills(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	db := models.GetDB()

	var skills []models.Skill
	var total int64

	db.Model(&models.Skill{}).Count(&total)

	offset := (page - 1) * pageSize
	db.Preload("Category").Preload("Tags").Offset(offset).Limit(pageSize).Find(&skills)

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data": gin.H{
			"list":      skills,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
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
// @Success 200 {object} map[string]interface{}
// @Router /admin/users [get]
func ListUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	db := models.GetDB()

	var users []models.User
	var total int64

	db.Model(&models.User{}).Count(&total)

	offset := (page - 1) * pageSize
	db.Preload("Profile").Offset(offset).Limit(pageSize).Find(&users)

	// 清除敏感信息
	for i := range users {
		users[i].PasswordHash = ""
	}

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data": gin.H{
			"list":      users,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
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
// @Success 200 {object} map[string]interface{}
// @Router /admin/orders [get]
func ListOrders(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	db := models.GetDB()

	var orders []models.Order
	var total int64

	db.Model(&models.Order{}).Count(&total)

	offset := (page - 1) * pageSize
	db.Preload("Items").Preload("Items.Skill").Preload("User").
		Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&orders)

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data": gin.H{
			"list":      orders,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
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

	var analytics AnalyticsData

	// 用户统计
	db.Model(&models.User{}).Count(&analytics.TotalUsers)

	// 技能统计
	db.Model(&models.Skill{}).Count(&analytics.TotalSkills)
	db.Model(&models.Skill{}).Where("is_active = ?", true).Count(&analytics.ActiveSkills)
	db.Model(&models.Skill{}).Where("price_type = ?", "paid").Count(&analytics.PaidSkills)
	db.Model(&models.Skill{}).Where("price_type = ?", "free").Count(&analytics.FreeSkills)

	// 订单统计
	db.Model(&models.Order{}).Count(&analytics.TotalOrders)

	// 收入统计
	var totalRevenue float64
	db.Model(&models.Order{}).Select("COALESCE(SUM(total_amount), 0)").Scan(&totalRevenue)
	analytics.TotalRevenue = totalRevenue

	// 今日统计
	var todayOrders int64
	var todayRevenue float64

	db.Model(&models.Order{}).
		Where("DATE(created_at) = CURRENT_DATE").
		Count(&todayOrders)

	db.Model(&models.Order{}).
		Where("DATE(created_at) = CURRENT_DATE").
		Select("COALESCE(SUM(total_amount), 0)").
		Scan(&todayRevenue)

	analytics.TodayOrders = todayOrders
	analytics.TodayRevenue = todayRevenue

	// 最近订单
	var modelOrders []models.Order
	db.Model(&models.Order{}).
		Preload("User").
		Order("created_at DESC").
		Limit(10).
		Find(&modelOrders)

	// 转换为API响应格式
	for _, order := range modelOrders {
		analytics.RecentOrders = append(analytics.RecentOrders, Order{
			ID:          order.ID.String(),
			OrderNo:     order.OrderNo,
			UserEmail:   order.User.Email,
			TotalAmount: order.TotalAmount,
			Status:      string(order.Status),
			CreatedAt:   order.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data":    analytics,
	})
}
