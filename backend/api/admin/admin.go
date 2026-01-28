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
	c.JSON(200, gin.H{
		"code":    0,
		"message": "UpdateSkill endpoint - temporarily disabled",
	})
}

// ListUsers 列出用户
func ListUsers(c *gin.Context) {
	c.JSON(200, gin.H{
		"code":    0,
		"message": "ListUsers endpoint - temporarily disabled",
	})
}

// ListOrders 列出订单
func ListOrders(c *gin.Context) {
	c.JSON(200, gin.H{
		"code":    0,
		"message": "ListOrders endpoint - temporarily disabled",
	})
}

// GetAnalytics 获取统计信息
func GetAnalytics(c *gin.Context) {
	c.JSON(200, gin.H{
		"code":    0,
		"message": "GetAnalytics endpoint - temporarily disabled",
	})
}
