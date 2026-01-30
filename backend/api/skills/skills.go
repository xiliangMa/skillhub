package skills

import (
	"skillhub/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ListSkillsResponse 列表响应
type ListSkillsResponse struct {
	List      []models.Skill `json:"list"`
	Total     int64          `json:"total"`
	Page      int            `json:"page"`
	PageSize  int            `json:"page_size"`
}

// ListSkills 列出所有skills
// @Summary 获取技能列表
// @Description 分页获取技能列表
// @Tags skills
// @Accept json
// @Produce json
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(20)
// @Param category_id query string false "分类ID"
// @Param search query string false "搜索关键词"
// @Success 200 {object} ListSkillsResponse
// @Router /skills [get]
func ListSkills(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	categoryID := c.Query("category_id")
	search := c.Query("search")

	db := models.GetDB()

	// 基础查询
	query := db.Model(&models.Skill{}).Where("is_active = ?", true)

	// 分类过滤
	if categoryID != "" {
		if uuid, err := uuid.Parse(categoryID); err == nil {
			query = query.Where("category_id = ?", uuid)
		}
	}

	// 搜索过滤
	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where("name ILIKE ? OR description ILIKE ?", searchTerm, searchTerm)
	}

	var skills []models.Skill
	var total int64

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Preload("Category").Preload("Tags").Offset(offset).Limit(pageSize).Find(&skills)

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data": ListSkillsResponse{
			List:     skills,
			Total:    total,
			Page:     page,
			PageSize: pageSize,
		},
	})
}

// GetSkill 获取单个skill详情
// @Summary 获取技能详情
// @Description 根据ID获取技能详细信息
// @Tags skills
// @Accept json
// @Produce json
// @Param id path string true "技能ID"
// @Success 200 {object} models.Skill
// @Router /skills/{id} [get]
func GetSkill(c *gin.Context) {
	id := c.Param("id")

	uid, err := uuid.Parse(id)
	if err != nil {
		c.JSON(400, gin.H{
			"code":    400,
			"message": "Invalid skill ID",
		})
		return
	}

	var skill models.Skill
	db := models.GetDB()

	if err := db.Preload("Category").Preload("Tags").Preload("Translations").
		Where("id = ? AND is_active = ?", uid, true).First(&skill).Error; err != nil {
		c.JSON(404, gin.H{
			"code":    404,
			"message": "Skill not found",
		})
		return
	}

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data":    skill,
	})
}

// GetCategories 获取所有分类
// @Summary 获取分类列表
// @Description 获取所有技能分类
// @Tags skills
// @Accept json
// @Produce json
// @Success 200 {array} models.SkillCategory
// @Router /skills/categories [get]
func GetCategories(c *gin.Context) {
	db := models.GetDB()

	var categories []models.SkillCategory
	db.Preload("Children").Where("parent_id IS NULL").Find(&categories)

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data":    categories,
	})
}

// GetHotSkills 获取热门skills
// @Summary 获取热门技能
// @Description 根据下载量获取热门技能
// @Tags skills
// @Accept json
// @Produce json
// @Param limit query int false "返回数量" default(10)
// @Success 200 {array} models.Skill
// @Router /skills/hot [get]
func GetHotSkills(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	db := models.GetDB()

	var skills []models.Skill
	db.Preload("Category").Where("is_active = ?", true).
		Order("downloads_count DESC").
		Limit(limit).
		Find(&skills)

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data":    skills,
	})
}

// GetTrendingSkills 获取趋势skills
// @Summary 获取趋势技能
// @Description 根据评分和最近更新获取趋势技能
// @Tags skills
// @Accept json
// @Produce json
// @Param limit query int false "返回数量" default(10)
// @Success 200 {array} models.Skill
// @Router /skills/trending [get]
func GetTrendingSkills(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	db := models.GetDB()

	var skills []models.Skill
	db.Preload("Category").Where("is_active = ?", true).
		Order("rating DESC, updated_at DESC").
		Limit(limit).
		Find(&skills)

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data":    skills,
	})
}

// DownloadSkill 下载技能
// @Summary 下载技能
// @Description 记录下载并返回下载链接
// @Tags skills
// @Accept json
// @Produce json
// @Param id path string true "技能ID"
// @Success 200 {object} object
// @Router /skills/{id}/download [get]
func DownloadSkill(c *gin.Context) {
	id := c.Param("id")

	uid, err := uuid.Parse(id)
	if err != nil {
		c.JSON(400, gin.H{
			"code":    400,
			"message": "Invalid skill ID",
		})
		return
	}

	db := models.GetDB()
	var userID string

	// 获取技能信息
	var skill models.Skill
	if err := db.Where("id = ? AND is_active = ?", uid, true).First(&skill).Error; err != nil {
		c.JSON(404, gin.H{
			"code":    404,
			"message": "Skill not found",
		})
		return
	}

	// 检查是否需要购买
	if skill.PriceType == models.PriceTypePaid {
		// 验证购买记录
		userID = c.GetString("user_id")
		if userID == "" {
			c.JSON(401, gin.H{
				"code":    401,
				"message": "Please login to download",
			})
			return
		}

		userUUID := uuid.MustParse(userID)
		var existingOrder models.Order
		if err := db.Joins("JOIN order_items ON order_items.order_id = orders.id").
			Where("orders.user_id = ? AND orders.status = ? AND order_items.skill_id = ?",
				userUUID, models.OrderStatusPaid, uid).
			First(&existingOrder).Error; err != nil {
			c.JSON(403, gin.H{
				"code":    403,
				"message": "Please purchase this skill first",
			})
			return
		}
		// 购买验证通过，允许下载
	}

	// 记录下载
	if userID != "" {
		downloadRecord := models.DownloadRecord{
			SkillID:   uid,
			UserID:    uuid.MustParse(userID),
			IPAddress: c.ClientIP(),
			CreatedAt: time.Now(),
		}
		db.Create(&downloadRecord)

		// 更新技能下载量
		db.Model(&skill).UpdateColumn("downloads_count", gorm.Expr("downloads_count + ?", 1))
	} else if skill.PriceType == models.PriceTypeFree {
		// 免费技能也可以下载，但不记录用户
		db.Model(&skill).UpdateColumn("downloads_count", gorm.Expr("downloads_count + ?", 1))
	}

	// 返回下载链接
	downloadURL := skill.GitHubURL
	if downloadURL == "" {
		downloadURL = "https://github.com/skillhub/skills/archive/refs/heads/main.zip"
	}

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data": gin.H{
			"download_url": downloadURL,
			"skill_id":    id,
		},
	})
}

// PurchaseSkill 购买技能
// @Summary 购买技能
// @Description 创建订单并处理支付
// @Tags skills
// @Accept json
// @Produce json
// @Param id path string true "技能ID"
// @Success 200 {object} object
// @Router /skills/{id}/purchase [post]
func PurchaseSkill(c *gin.Context) {
	id := c.Param("id")

	uid, err := uuid.Parse(id)
	if err != nil {
		c.JSON(400, gin.H{
			"code":    400,
			"message": "Invalid skill ID",
		})
		return
	}

	// 获取用户ID
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(401, gin.H{
			"code":    401,
			"message": "Please login first",
		})
		return
	}

	userUUID := uuid.MustParse(userID)

	db := models.GetDB()

	// 获取技能信息
	var skill models.Skill
	if err := db.Where("id = ? AND is_active = ?", uid, true).First(&skill).Error; err != nil {
		c.JSON(404, gin.H{
			"code":    404,
			"message": "Skill not found",
		})
		return
	}

	// 检查是否是免费技能
	if skill.PriceType == models.PriceTypeFree {
		c.JSON(400, gin.H{
			"code":    400,
			"message": "This skill is free, no purchase required",
		})
		return
	}

	// 检查是否已购买
	var existingOrder models.Order
	if err := db.Joins("JOIN order_items ON order_items.order_id = orders.id").
		Where("orders.user_id = ? AND orders.status = ? AND order_items.skill_id = ?",
			userUUID, models.OrderStatusPaid, uid).
		First(&existingOrder).Error; err == nil {
		c.JSON(400, gin.H{
			"code":    400,
			"message": "Skill already purchased",
		})
		return
	}

	// 创建订单
	orderNo := "ORD" + time.Now().Format("20060102150405")
	order := models.Order{
		ID:           uuid.New(),
		UserID:       userUUID,
		OrderNo:       orderNo,
		TotalAmount:  skill.Price,
		PaymentMethod: "pending",
		Status:       "pending",
		CreatedAt:    time.Now(),
	}

	if err := db.Create(&order).Error; err != nil {
		c.JSON(500, gin.H{
			"code":    500,
			"message": "Failed to create order",
		})
		return
	}

	// TODO: 集成支付网关（支付宝/微信支付等）

	// 这里暂时直接标记为已支付
	now := time.Now()
	order.Status = "paid"
	order.PaidAt = &now
	db.Save(&order)

	// 更新技能购买量
	db.Model(&skill).UpdateColumn("purchases_count", gorm.Expr("purchases_count + ?", 1))

	c.JSON(200, gin.H{
		"code":    0,
		"message": "Purchase successful",
		"data": gin.H{
			"order_id": order.ID.String(),
			"order_no": order.OrderNo,
			"skill_id": id,
			"amount":   skill.Price,
		},
	})
}
