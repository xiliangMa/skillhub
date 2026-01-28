package skills

import (
	"skillhub/models"
	"strconv"

	"github.com/gin-gonic/gin"
)

// ListSkills 列出所有skills
// @Summary 获取技能列表
// @Tags skills
// @Accept json
// @Produce json
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(20)
// @Param category query int false "分类ID"
// @Param search query string false "搜索关键词"
// @Param price_type query string false "价格类型(free/paid)"
// @Success 200 {object} map[string]interface{}
// @Router /skills [get]
func ListSkills(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	categoryID := c.Query("category")
	search := c.Query("search")
	priceType := c.Query("price_type")

	db := models.GetDB()

	// 构建查询
	query := db.Model(&models.Skill{})

	if categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}

	if search != "" {
		query = query.Where("name LIKE ? OR description LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	if priceType != "" {
		query = query.Where("price_type = ?", priceType)
	}

	// 获取总数
	var total int64
	query.Count(&total)

	// 分页查询
	var skills []models.Skill
	offset := (page - 1) * pageSize
	query.Offset(offset).Limit(pageSize).Find(&skills)

	// 加载分类信息
	for i := range skills {
		var category models.SkillCategory
		db.First(&category, skills[i].CategoryID)
		skills[i].Category = &category
	}

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

// GetSkill 获取单个skill详情
// @Summary 获取技能详情
// @Tags skills
// @Accept json
// @Produce json
// @Param id path int true "技能ID"
// @Success 200 {object} map[string]interface{}
// @Router /skills/{id} [get]
func GetSkill(c *gin.Context) {
	id := c.Param("id")

	var skill models.Skill
	db := models.GetDB()

	if err := db.First(&skill, id).Error; err != nil {
		c.JSON(404, gin.H{
			"code":    404,
			"message": "Skill not found",
		})
		return
	}

	// 加载关联数据
	db.Model(&skill).Association("Category").Find(&skill.Category)

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data":    skill,
	})
}

// GetCategories 获取所有分类
// @Summary 获取技能分类列表
// @Tags skills
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /skills/categories [get]
func GetCategories(c *gin.Context) {
	var categories []models.SkillCategory
	db := models.GetDB()

	db.Order("sort_order ASC").Find(&categories)

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data":    categories,
	})
}

// GetHotSkills 获取热门skills
// @Summary 获取热门技能
// @Tags skills
// @Accept json
// @Produce json
// @Param limit query int false "数量限制" default(10)
// @Success 200 {object} map[string]interface{}
// @Router /skills/hot [get]
func GetHotSkills(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	var skills []models.Skill
	db := models.GetDB()

	// 按下载量+购买量排序
	db.Order("downloads_count + purchases_count DESC").Limit(limit).Find(&skills)

	// 加载分类信息
	for i := range skills {
		var category models.SkillCategory
		db.First(&category, skills[i].CategoryID)
		skills[i].Category = &category
	}

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data":    skills,
	})
}

// GetTrendingSkills 获取趋势skills
// @Summary 获取趋势技能
// @Tags skills
// @Accept json
// @Produce json
// @Param limit query int false "数量限制" default(10)
// @Success 200 {object} map[string]interface{}
// @Router /skills/trending [get]
func GetTrendingSkills(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	var skills []models.Skill
	db := models.GetDB()

	// 按stars数排序
	db.Order("stars_count DESC").Limit(limit).Find(&skills)

	// 加载分类信息
	for i := range skills {
		var category models.SkillCategory
		db.First(&category, skills[i].CategoryID)
		skills[i].Category = &category
	}

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data":    skills,
	})
}
