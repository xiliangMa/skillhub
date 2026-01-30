package payment

import (
	"encoding/json"
	"fmt"
	"io"
	"net/url"
	"skillhub/config"
	"skillhub/models"
	"strconv"
	"time"
	svcpayment "skillhub/services/payment"

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
// @Router /payment/orders/{id}/pay [post]
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

	// 获取支付服务
	paymentService := svcpayment.GetDefaultPaymentService(*config.AppConfig)

	// 获取技能名称作为支付主题
	var skillName string
	var orderItem models.OrderItem
	if err := db.Where("order_id = ?", order.ID).First(&orderItem).Error; err == nil && orderItem.SkillID != nil {
		var skill models.Skill
		if err := db.First(&skill, "id = ?", orderItem.SkillID).Error; err == nil {
			skillName = skill.Name
		}
	}
	if skillName == "" {
		skillName = fmt.Sprintf("Skill Order #%s", order.OrderNo)
	}

	// 生成支付链接
	paymentURL, err := paymentService.CreatePayment(&order, skillName)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to create payment", "details": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"code":    0,
		"message": "success",
		"data": gin.H{
			"payment_url": paymentURL,
			"order_id":    order.ID.String(),
			"order_no":    order.OrderNo,
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
	// 解析回调参数
	var params url.Values
	if c.Request.Method == "POST" {
		if err := c.Request.ParseForm(); err != nil {
			c.JSON(400, gin.H{"error": "Failed to parse form data"})
			return
		}
		params = c.Request.Form
	} else {
		params = c.Request.URL.Query()
	}

	// 获取支付服务
	paymentService := svcpayment.GetDefaultPaymentService(*config.AppConfig)

	// 处理回调
	callbackResult, err := paymentService.ProcessCallback(params)

	if err != nil {
		c.JSON(400, gin.H{"error": "Failed to process callback", "details": err.Error()})
		return
	}

	// 根据交易状态更新订单
	db := models.GetDB()
	var order models.Order
	if err := db.Where("order_no = ?", callbackResult.OutTradeNo).First(&order).Error; err != nil {
		c.JSON(404, gin.H{"error": "Order not found"})
		return
	}

	// 更新订单状态
	switch callbackResult.TradeStatus {
	case "TRADE_SUCCESS", "TRADE_FINISHED":
		now := time.Now()
		order.Status = models.OrderStatusPaid
		order.PaidAt = &now
		order.PaymentMethod = string(callbackResult.PaymentType)

		// 创建交易记录
		transaction := models.Transaction{
			ID:             uuid.New(),
			OrderID:        order.ID,
			PaymentChannel: string(callbackResult.PaymentType),
			TransactionID:  callbackResult.TradeNo,
			Amount:         parseFloat(callbackResult.TotalAmount),
			Status:         models.TransactionStatusSuccess,
			RawResponse:    marshalParams(callbackResult.RawParams),
		}
		db.Create(&transaction)

	case "TRADE_CLOSED":
		order.Status = models.OrderStatusCancelled

	case "WAIT_BUYER_PAY":
		// 等待支付，不做处理
	default:
		// 其他状态
	}

	if err := db.Save(&order).Error; err != nil {
		c.JSON(500, gin.H{"error": "Failed to update order"})
		return
	}

	// 返回成功响应（支付宝要求返回success）
	c.String(200, "success")
}

// StripeCallback Stripe支付回调
// @Summary Stripe支付回调
// @Description Stripe支付成功后的Webhook回调
// @Tags payment
// @Accept json
// @Produce json
// @Router /payment/callback/stripe [post]
func StripeCallback(c *gin.Context) {
	// 读取请求体
	payload, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(400, gin.H{"error": "Failed to read request body"})
		return
	}

	// 获取签名
	signature := c.GetHeader("Stripe-Signature")
	if signature == "" {
		c.JSON(400, gin.H{"error": "Missing Stripe-Signature header"})
		return
	}

	// 获取支付服务
	paymentService := svcpayment.GetDefaultPaymentService(*config.AppConfig)

	// 尝试转换为Stripe客户端
	stripeClient, ok := paymentService.(*svcpayment.StripeClient)
	if !ok {
		// 如果不是Stripe客户端，尝试模拟客户端
		mockClient, ok := paymentService.(*svcpayment.MockStripeClient)
		if !ok {
			c.JSON(500, gin.H{"error": "Stripe client not available"})
			return
		}
		// 使用模拟客户端处理
		callbackResult, err := mockClient.ProcessWebhook(payload, signature)
		if err != nil {
			c.JSON(400, gin.H{"error": "Failed to process webhook", "details": err.Error()})
			return
		}
		updateOrderFromCallback(callbackResult)
		c.JSON(200, gin.H{"status": "success"})
		return
	}

	// 使用真实Stripe客户端处理Webhook
	callbackResult, err := stripeClient.ProcessWebhook(payload, signature)
	if err != nil {
		c.JSON(400, gin.H{"error": "Failed to process webhook", "details": err.Error()})
		return
	}

	updateOrderFromCallback(callbackResult)
	c.JSON(200, gin.H{"status": "success"})
}

// PayPalCallback PayPal支付回调
// @Summary PayPal支付回调
// @Description PayPal支付成功后的Webhook回调
// @Tags payment
// @Accept json
// @Produce json
// @Router /payment/callback/paypal [post]
func PayPalCallback(c *gin.Context) {
	// 读取请求体
	payload, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(400, gin.H{"error": "Failed to read request body"})
		return
	}

	// 获取签名
	signature := c.GetHeader("PayPal-Transmission-Sig")
	if signature == "" {
		// PayPal可能使用其他头，尝试获取
		signature = c.GetHeader("Paypal-Transmission-Signature")
	}

	// 获取支付服务
	paymentService := svcpayment.GetDefaultPaymentService(*config.AppConfig)

	// 尝试转换为PayPal客户端
	paypalClient, ok := paymentService.(*svcpayment.PayPalClient)
	if !ok {
		// 如果不是PayPal客户端，尝试模拟客户端
		mockClient, ok := paymentService.(*svcpayment.MockPayPalClient)
		if !ok {
			c.JSON(500, gin.H{"error": "PayPal client not available"})
			return
		}
		// 使用模拟客户端处理
		callbackResult, err := mockClient.ProcessWebhook(payload, signature)
		if err != nil {
			c.JSON(400, gin.H{"error": "Failed to process webhook", "details": err.Error()})
			return
		}
		updateOrderFromCallback(callbackResult)
		c.JSON(200, gin.H{"status": "success"})
		return
	}

	// 使用真实PayPal客户端处理Webhook
	callbackResult, err := paypalClient.ProcessWebhook(payload, signature)
	if err != nil {
		c.JSON(400, gin.H{"error": "Failed to process webhook", "details": err.Error()})
		return
	}

	updateOrderFromCallback(callbackResult)
	c.JSON(200, gin.H{"status": "success"})
}

// updateOrderFromCallback 根据回调结果更新订单
func updateOrderFromCallback(callbackResult *svcpayment.CallbackResult) {
	db := models.GetDB()
	if db == nil {
		return
	}

	var order models.Order
	if err := db.Where("order_no = ?", callbackResult.OutTradeNo).First(&order).Error; err != nil {
		return
	}

	// 更新订单状态
	switch callbackResult.TradeStatus {
	case "TRADE_SUCCESS", "TRADE_FINISHED", "succeeded", "COMPLETED":
		now := time.Now()
		order.Status = models.OrderStatusPaid
		order.PaidAt = &now
		order.PaymentMethod = string(callbackResult.PaymentType)

		// 创建交易记录
		transaction := models.Transaction{
			ID:             uuid.New(),
			OrderID:        order.ID,
			PaymentChannel: string(callbackResult.PaymentType),
			TransactionID:  callbackResult.TradeNo,
			Amount:         parseFloat(callbackResult.TotalAmount),
			Status:         models.TransactionStatusSuccess,
			RawResponse:    marshalParams(callbackResult.RawParams),
		}
		db.Create(&transaction)

	case "TRADE_CLOSED", "CANCELLED":
		order.Status = models.OrderStatusCancelled
	case "WAIT_BUYER_PAY", "PENDING":
		// 等待支付，不做处理
	default:
		// 其他状态
	}

	db.Save(&order)
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

// parseFloat 解析字符串为浮点数
func parseFloat(s string) float64 {
	var result float64
	fmt.Sscanf(s, "%f", &result)
	return result
}

// marshalParams 将URL参数序列化为JSON字符串
func marshalParams(params url.Values) string {
	data := make(map[string]string)
	for k, v := range params {
		if len(v) > 0 {
			data[k] = v[0]
		}
	}
	jsonData, _ := json.Marshal(data)
	return string(jsonData)
}

// MockCallbackRequest 模拟支付回调请求
type MockCallbackRequest struct {
	OrderNo     string `json:"order_no" binding:"required"`
	TradeStatus string `json:"trade_status" binding:"required"`
	PaymentType string `json:"payment_type"`
	TradeNo     string `json:"trade_no"`
	TotalAmount string `json:"total_amount"`
}

// MockCallback 模拟支付回调
// @Summary 模拟支付回调
// @Description 用于开发和测试环境的模拟支付回调
// @Tags payment
// @Accept json
// @Produce json
// @Param request body MockCallbackRequest true "回调参数"
// @Success 200 {string} string "success"
// @Router /payment/callback/mock [post]
func MockCallback(c *gin.Context) {
	var req MockCallbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	db := models.GetDB()

	// 查找订单
	var order models.Order
	if err := db.Where("order_no = ?", req.OrderNo).First(&order).Error; err != nil {
		c.JSON(404, gin.H{"error": "Order not found"})
		return
	}

	// 更新订单状态
	switch req.TradeStatus {
	case "TRADE_SUCCESS", "TRADE_FINISHED":
		now := time.Now()
		order.Status = models.OrderStatusPaid
		order.PaidAt = &now
		order.PaymentMethod = req.PaymentType
		if req.PaymentType == "" {
			order.PaymentMethod = "mock"
		}

		// 创建交易记录
		transaction := models.Transaction{
			ID:             uuid.New(),
			OrderID:        order.ID,
			PaymentChannel: req.PaymentType,
			TransactionID:  req.TradeNo,
			Amount:         parseFloat(req.TotalAmount),
			Status:         models.TransactionStatusSuccess,
			RawResponse:    fmt.Sprintf("mock callback: %+v", req),
		}
		db.Create(&transaction)

	case "TRADE_CLOSED":
		order.Status = models.OrderStatusCancelled
	case "WAIT_BUYER_PAY":
		// 等待支付，不做处理
	default:
		// 其他状态
	}

	if err := db.Save(&order).Error; err != nil {
		c.JSON(500, gin.H{"error": "Failed to update order"})
		return
	}

	// 返回成功响应
	c.String(200, "success")
}
