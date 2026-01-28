package admin

import (
	"skillhub/models"
	"strconv"

	"github.com/gin-gonic/gin"
)

// ListSkills 列出所有skills
// @Summary 管理员查看技能列表
// @Tags admin
// @Accept json
// @Produce json
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
	db.Offset(offset).Limit(pageSize).Find(&skills)

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

// UpdateSkill 更新技能
// @Summary 管理员更新技能
// @Tags admin
// @Accept json
// @Produce json
// @Param id path int true "技能ID"
// @Param request body map[string]interface{} true "更新数据"
// @Success 200 {object} map[string]interface{}
// @Router /admin/skills/{id} [put]
func UpdateSkill(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Name        string  `json:"name"`
		Description string  `json:"description"`
		PriceType   string  `json:"price_type"`
		Price       float64 `json:"price"`
		IsPublished *bool   `json:"is_published"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{
			"code":    400,
			"message": "Invalid request",
		})
		return
	}

	db := models.GetDB()
	var skill models.Skill
	db.First(&skill, id)

	if skill.ID == 0 {
		c.JSON(404, gin.H{
			"code":    404,
			"message": "Skill not found",
		})
		return
	}

	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.PriceType != "" {
		updates["price_type"] = req.PriceType
	}
	if req.Price > 0 {
		updates["price"] = req.Price
	}
	if req.IsPublished != nil {
		updates["is_published"] = *req.IsPublished
	}

	db.Model(&skill).Updates(updates)

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
	db.Offset(offset).Limit(pageSize).Find(&users)

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
// @Summary 管理员查看订单列表
// @Tags admin
// @Accept json
// @Produce json
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
	db.Offset(offset).Limit(pageSize).Find(&orders)

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

// GetAnalytics 获取统计信息
// @Summary 管理员获取统计信息
// @Tags admin
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /admin/analytics [get]
func GetAnalytics(c *gin.Context) {
	db := models.GetDB()

	var userCount, skillCount, orderCount int64

	db.Model(&models.User{}).Count(&userCount)
	db.Model(&models.Skill{}).Where("is_published = ?", true).Count(&skillCount)
	db.Model(&models.Order{}).Count(&orderCount)

	var totalRevenue float64
	db.Model(&models.Order{}).
		Where("status = ?", "paid").
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalRevenue)

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data": gin.H{
			"user_count":    userCount,
			"skill_count":   skillCount,
			"order_count":   orderCount,
			"total_revenue": totalRevenue,
		},
	})
}
