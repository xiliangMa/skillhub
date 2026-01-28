package payment

import (
	"fmt"
	"skillhub/config"
	"skillhub/models"

	alipay "github.com/smartwalle/alipay/v3"
	"github.com/stripe/stripe-go/v74"
	"github.com/stripe/stripe-go/v74/paymentintent"
)

type PaymentService struct {
	alipayClient *alipay.Client
	stripeClient *stripe.Backend
}

var PaymentSvc *PaymentService

// InitPayment 初始化支付服务
func InitPayment() {
	PaymentSvc = &PaymentService{
		stripeClient: stripe.GetBackendWithConfig(stripe.APIBackend, &stripe.BackendConfig{
			LeveledLogger: &stripe.LeveledLogger{},
		}),
	}

	// 初始化支付宝
	if config.AppConfig.Payment.Alipay.AppID != "" {
		client, err := alipay.New(config.AppConfig.Payment.Alipay.AppID, config.AppConfig.Payment.Alipay.PrivateKey, true)
		if err != nil {
			fmt.Printf("Error initializing Alipay: %v\n", err)
		} else {
			client.LoadAliPayPublicKey(config.AppConfig.Payment.Alipay.PublicKey)
			PaymentSvc.alipayClient = client
		}
	}

	// 初始化Stripe
	if config.AppConfig.Payment.Stripe.SecretKey != "" {
		stripe.Key = config.AppConfig.Payment.Stripe.SecretKey
	}
}

// CreateOrder 创建订单
func CreateOrder(userID uint, skillID uint, amount float64, paymentMethod string) (*models.Order, error) {
	db := models.GetDB()

	order := models.Order{
		UserID:        userID,
		Amount:        amount,
		PaymentMethod: paymentMethod,
		Status:        "pending",
	}

	if err := db.Create(&order).Error; err != nil {
		return nil, err
	}

	// 创建订单明细
	orderItem := models.OrderItem{
		OrderID: order.ID,
		SkillID: skillID,
		Price:   amount,
		Quantity: 1,
	}

	if err := db.Create(&orderItem).Error; err != nil {
		return nil, err
	}

	return &order, nil
}

// CreateAlipayPayment 创建支付宝支付
func (s *PaymentService) CreateAlipayPayment(orderID uint, subject string, amount float64, notifyURL, returnURL string) (string, error) {
	if s.alipayClient == nil {
		return "", fmt.Errorf("Alipay client not initialized")
	}

	var p = alipay.TradePagePay{}
	p.NotifyURL = notifyURL
	p.ReturnURL = returnURL
	p.Subject = subject
	p.OutTradeNo = fmt.Sprintf("ORDER%d", orderID)
	p.TotalAmount = fmt.Sprintf("%.2f", amount)
	p.ProductCode = "FAST_INSTANT_TRADE_PAY"

	url, err := s.alipayClient.TradePagePay(p)
	if err != nil {
		return "", err
	}

	return url.String(), nil
}

// CreateStripePayment 创建Stripe支付
func (s *PaymentService) CreateStripePayment(orderID uint, amount float64) (*stripe.PaymentIntent, error) {
	params := &stripe.PaymentIntentParams{
		Amount:   stripe.Int64(int64(amount * 100)), // 转换为分
		Currency: stripe.String("usd"),
		Metadata: map[string]string{
			"order_id": fmt.Sprintf("%d", orderID),
		},
	}

	pi, err := paymentintent.New(params)
	if err != nil {
		return nil, err
	}

	return pi, nil
}

// ProcessAlipayCallback 处理支付宝回调
func (s *PaymentService) ProcessAlipayCallback(notification *alipay.Notification) (bool, string, error) {
	if s.alipayClient == nil {
		return false, "", fmt.Errorf("Alipay client not initialized")
	}

	var p = alipay.TradeNotification{}
	err := notification.Execute(&p)
	if err != nil {
		return false, "", err
	}

	return p.TradeStatus == "TRADE_SUCCESS", p.OutTradeNo, nil
}

// UpdateOrderStatus 更新订单状态
func UpdateOrderStatus(orderID uint, status string, transactionID string) error {
	db := models.GetDB()

	tx := db.Begin()

	// 更新订单
	if err := tx.Model(&models.Order{}).Where("id = ?", orderID).Updates(map[string]interface{}{
		"status":         status,
		"payment_time":   tx.Now(),
		"transaction_id": transactionID,
	}).Error; err != nil {
		tx.Rollback()
		return err
	}

	// 创建交易记录
	var order models.Order
	tx.First(&order, orderID)

	transaction := models.Transaction{
		OrderID:       orderID,
		PaymentMethod: order.PaymentMethod,
		TransactionID: transactionID,
		Amount:        order.Amount,
		Status:        "completed",
	}

	if err := tx.Create(&transaction).Error; err != nil {
		tx.Rollback()
		return err
	}

	// 更新技能购买量
	var orderItem models.OrderItem
	tx.Where("order_id = ?", orderID).First(&orderItem)

	tx.Model(&models.Skill{}).Where("id = ?", orderItem.SkillID).UpdateColumn("purchases_count", models.Raw("purchases_count + ?", 1))

	return tx.Commit().Error
}

// RefundOrder 退款
func RefundOrder(orderID uint) error {
	// TODO: 实现退款逻辑
	return nil
}
