package payment

import (
	"skillhub/models"
	"strconv"

	"github.com/gin-gonic/gin"
)

// CreateOrder 创建订单
// @Summary 创建订单
// @Tags payment
// @Accept json
// @Produce json
// @Param request body map[string]interface{} true "订单信息"
// @Success 200 {object} map[string]interface{}
// @Router /payment/orders [post]
func CreateOrder(c *gin.Context) {
	var req struct {
		SkillID      uint   `json:"skill_id" binding:"required"`
		PaymentMethod string `json:"payment_method" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{
			"code":    400,
			"message": "Invalid request",
		})
		return
	}

	// 获取用户ID (从JWT token)
	userID := c.GetUint("user_id")

	// 获取技能信息
	var skill models.Skill
	db := models.GetDB()
	db.First(&skill, req.SkillID)

	if skill.ID == 0 {
		c.JSON(404, gin.H{
			"code":    404,
			"message": "Skill not found",
		})
		return
	}

	// 检查是否为免费技能
	if skill.PriceType == "free" {
		c.JSON(400, gin.H{
			"code":    400,
			"message": "This skill is free",
		})
		return
	}

	// 检查用户是否已购买
	var order models.Order
	db.Where("user_id = ? AND status = ?", userID, "paid").
		Joins("JOIN order_items ON orders.id = order_items.order_id").
		Where("order_items.skill_id = ?", req.SkillID).
		First(&order)

	if order.ID != 0 {
		c.JSON(400, gin.H{
			"code":    400,
			"message": "You have already purchased this skill",
		})
		return
	}

	// 创建订单
	order, err := CreateOrder(userID, req.SkillID, skill.Price, req.PaymentMethod)
	if err != nil {
		c.JSON(500, gin.H{
			"code":    500,
			"message": "Failed to create order",
		})
		return
	}

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data":    order,
	})
}

// GetPaymentURL 获取支付链接
// @Summary 获取支付链接
// @Tags payment
// @Accept json
// @Produce json
// @Param id path int true "订单ID"
// @Success 200 {object} map[string]interface{}
// @Router /payment/orders/{id}/pay [post]
func GetPaymentURL(c *gin.Context) {
	orderID, _ := strconv.Atoi(c.Param("id"))

	var order models.Order
	db := models.GetDB()
	db.First(&order, orderID)

	if order.ID == 0 {
		c.JSON(404, gin.H{
			"code":    404,
			"message": "Order not found",
		})
		return
	}

	var paymentURL string
	var clientSecret string
	var err error

	switch order.PaymentMethod {
	case "alipay":
		var skill models.Skill
		db.First(&skill, func() uint {
			var item models.OrderItem
			db.Where("order_id = ?", orderID).First(&item)
			return item.SkillID
		}())

		paymentURL, err = PaymentSvc.CreateAlipayPayment(
			uint(orderID),
			skill.Name,
			order.Amount,
			"http://localhost:8080/api/v1/payment/callback/alipay",
			"http://localhost:3000/payment/success",
		)
	case "stripe":
		pi, err := PaymentSvc.CreateStripePayment(uint(orderID), order.Amount)
		if err != nil {
			c.JSON(500, gin.H{
				"code":    500,
				"message": "Failed to create payment",
			})
			return
		}
		clientSecret = pi.ClientSecret
	default:
		c.JSON(400, gin.H{
			"code":    400,
			"message": "Unsupported payment method",
		})
		return
	}

	if err != nil {
		c.JSON(500, gin.H{
			"code":    500,
			"message": "Failed to create payment",
		})
		return
	}

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data": gin.H{
			"payment_url":   paymentURL,
			"client_secret": clientSecret,
		},
	})
}

// AlipayCallback 支付宝回调
// @Summary 支付宝支付回调
// @Tags payment
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /payment/callback/alipay [post]
func AlipayCallback(c *gin.Context) {
	// 解析支付宝回调参数
	var notification struct {
		TradeStatus string `form:"trade_status"`
		OutTradeNo  string `form:"out_trade_no"`
		TradeNo     string `form:"trade_no"`
	}

	if err := c.ShouldBind(&notification); err != nil {
		c.JSON(400, gin.H{"message": "Invalid request"})
		return
	}

	// 验证并处理回调
	success, orderNo, err := PaymentSvc.ProcessAlipayCallback(nil)
	if err != nil || !success {
		c.JSON(400, gin.H{"message": "Payment failed"})
		return
	}

	// 更新订单状态
	orderID, _ := strconv.Atoi(orderNo[5:]) // 去掉"ORDER"前缀
	if err := UpdateOrderStatus(uint(orderID), "paid", notification.TradeNo); err != nil {
		c.JSON(500, gin.H{"message": "Failed to update order"})
		return
	}

	c.JSON(200, gin.H{"message": "success"})
}

// GetOrders 获取用户订单列表
// @Summary 获取用户订单
// @Tags payment
// @Accept json
// @Produce json
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(20)
// @Success 200 {object} map[string]interface{}
// @Router /payment/orders [get]
func GetOrders(c *gin.Context) {
	userID := c.GetUint("user_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	db := models.GetDB()

	var orders []models.Order
	var total int64

	db.Model(&models.Order{}).Where("user_id = ?", userID).Count(&total)

	offset := (page - 1) * pageSize
	db.Where("user_id = ?", userID).
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
