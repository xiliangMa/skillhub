package payment

import (
	"skillhub/models"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// CreateOrderRequest 创建订单请求
type CreateOrderRequest struct {
	SkillID uuid.UUID `json:"skill_id" binding:"required"`
}

// CreateOrder 创建订单
// @Summary 创建订单
// @Description 创建购买订单
// @Tags payment
// @Accept json
// @Produce json
// @Security Bearer
// @Param request body CreateOrderRequest true "订单信息"
// @Success 200 {object} models.Order
// @Router /payment/orders [post]
func CreateOrder(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	var req CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	db := models.GetDB()

	// 查询技能
	var skill models.Skill
	if err := db.First(&skill, "id = ? AND is_active = ?", req.SkillID, true).Error; err != nil {
		c.JSON(404, gin.H{"error": "Skill not found"})
		return
	}

	// 检查是否已购买
	var existingOrder models.Order
	if err := db.Where("user_id = ? AND skill_id = ?", userID, req.SkillID).
		First(&existingOrder).Error; err == nil {
		c.JSON(400, gin.H{"error": "Skill already purchased"})
		return
	}

	// 创建订单
	orderNo := "ORD" + uuid.New().String()[:8]
	order := models.Order{
		ID:          uuid.New(),
		OrderNo:     orderNo,
		UserID:      userID.(uuid.UUID),
		TotalAmount: skill.Price,
		Status:      models.OrderStatusPending,
	}

	if err := db.Create(&order).Error; err != nil {
		c.JSON(500, gin.H{"error": "Failed to create order"})
		return
	}

	// 创建订单项
	orderItem := models.OrderItem{
		ID:      uuid.New(),
		OrderID: order.ID,
		SkillID: &req.SkillID,
		Price:   skill.Price,
		Quantity: 1,
	}

	db.Create(&orderItem)

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data":    order,
	})
}

// GetPaymentURL 获取支付链接
// @Summary 获取支付链接
// @Description 获取订单的支付链接
// @Tags payment
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path string true "订单ID"
// @Success 200 {object} map[string]interface{}
// @Router /payment/payment/orders/{id}/pay [post]
func GetPaymentURL(c *gin.Context) {
	id := c.Param("id")

	uid, err := uuid.Parse(id)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid order ID"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	db := models.GetDB()

	var order models.Order
	if err := db.Where("id = ? AND user_id = ?", uid, userID).
		First(&order).Error; err != nil {
		c.JSON(404, gin.H{"error": "Order not found"})
		return
	}

	// TODO: 集成真实的支付网关
	// 这里暂时返回模拟的支付链接
	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data": gin.H{
			"payment_url": "https://example.com/pay?id=" + order.ID.String(),
			"order_id":    order.ID.String(),
		},
	})
}

// AlipayCallback 支付宝回调
// @Summary 支付宝支付回调
// @Description 支付宝支付成功后的回调
// @Tags payment
// @Accept json
// @Produce json
// @Router /payment/callback/alipay [post]
func AlipayCallback(c *gin.Context) {
	// TODO: 验证支付宝签名
	c.JSON(200, gin.H{
		"code":    0,
		"message": "Payment callback received",
	})
}

// GetOrders 获取用户订单列表
// @Summary 获取用户订单
// @Description 获取当前用户的订单列表
// @Tags payment
// @Accept json
// @Produce json
// @Security Bearer
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(20)
// @Success 200 {object} map[string]interface{}
// @Router /payment/orders [get]
func GetOrders(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	db := models.GetDB()

	var orders []models.Order
	var total int64

	db.Model(&models.Order{}).Where("user_id = ?", userID).Count(&total)

	offset := (page - 1) * pageSize
	db.Preload("Items").Preload("Items.Skill").
		Where("user_id = ?", userID).
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
