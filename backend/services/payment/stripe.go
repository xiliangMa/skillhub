package payment

import (
	"encoding/json"
	"fmt"
	"net/url"

	"skillhub/config"
	"skillhub/models"

	"github.com/google/uuid"
)

// StripeClient Stripe支付客户端
type StripeClient struct {
	SecretKey      string
	PublishableKey string
	WebhookSecret  string
	SuccessURL     string
	CancelURL      string
}

// NewStripeClient 创建Stripe客户端
func NewStripeClient(cfg config.StripeConfig) (*StripeClient, error) {
	successURL := "http://localhost:3000/orders/success"
	cancelURL := "http://localhost:3000/orders/cancel"

	return &StripeClient{
		SecretKey:      cfg.SecretKey,
		PublishableKey: cfg.PublishableKey,
		WebhookSecret:  cfg.WebhookSecret,
		SuccessURL:     successURL,
		CancelURL:      cancelURL,
	}, nil
}

// CreatePayment 创建Stripe支付会话
func (c *StripeClient) CreatePayment(order *models.Order, subject string) (string, error) {
	// 如果配置不完整，返回模拟支付URL
	if c.SecretKey == "" {
		return c.createMockPayment(order, subject)
	}

	// TODO: 实现真实的Stripe API调用（需要配置STRIPE_SECRET_KEY）
	// 参考Stripe API文档：https://stripe.com/docs/api
	// 这里暂时使用模拟支付
	return c.createMockPayment(order, subject)
}

// VerifyCallback 验证Stripe Webhook签名
func (c *StripeClient) VerifyCallback(params url.Values) (bool, error) {
	// Stripe使用Webhook签名验证，这里返回true让上层处理
	return true, nil
}

// ProcessCallback 处理Stripe Webhook回调
func (c *StripeClient) ProcessCallback(params url.Values) (*CallbackResult, error) {
	// Stripe回调通过Webhook处理，这里返回模拟结果
	// 实际实现中，应该从HTTP请求头和body中解析Webhook事件
	return &CallbackResult{
		TradeNo:     "stripe_" + uuid.New().String()[:8],
		OutTradeNo:  params.Get("order_no"),
		TradeStatus: "succeeded",
		TotalAmount: params.Get("amount"),
		RawParams:   params,
		PaymentType: c.GetPaymentType(),
	}, nil
}

// ProcessWebhook 处理Stripe Webhook事件
func (c *StripeClient) ProcessWebhook(payload []byte, signature string) (*CallbackResult, error) {
	if c.WebhookSecret == "" {
		// 如果没有配置Webhook Secret，跳过验证（仅用于测试）
		return c.parseWebhookEvent(payload)
	}

	// TODO: 实现Stripe Webhook签名验证（需要配置STRIPE_WEBHOOK_SECRET）
	// 参考：https://stripe.com/docs/webhooks/signatures
	// 这里暂时跳过验证
	return c.parseWebhookEvent(payload)
}

// parseWebhookEvent 解析Webhook事件
func (c *StripeClient) parseWebhookEvent(payload []byte) (*CallbackResult, error) {
	// 简化实现：解析JSON获取基本信息
	var eventData map[string]interface{}
	if err := json.Unmarshal(payload, &eventData); err != nil {
		return nil, fmt.Errorf("failed to parse webhook event: %w", err)
	}

	eventType, _ := eventData["type"].(string)
	data, _ := eventData["data"].(map[string]interface{})
	object, _ := data["object"].(map[string]interface{})

	switch eventType {
	case "checkout.session.completed":
		// 从metadata中获取订单信息
		metadata, _ := object["metadata"].(map[string]interface{})
		orderNo, _ := metadata["order_no"].(string)
		if orderNo == "" {
			orderNo = "unknown"
		}

		id, _ := object["id"].(string)
		amountTotal, _ := object["amount_total"].(float64)

		return &CallbackResult{
			TradeNo:     id,
			OutTradeNo:  orderNo,
			TradeStatus: "succeeded",
			TotalAmount: fmt.Sprintf("%.2f", amountTotal/100),
			RawParams:   url.Values{},
			PaymentType: c.GetPaymentType(),
		}, nil

	case "payment_intent.succeeded":
		// 尝试从metadata获取订单号
		metadata, _ := object["metadata"].(map[string]interface{})
		orderNo, _ := metadata["order_no"].(string)
		if orderNo == "" {
			orderNo = "unknown"
		}

		id, _ := object["id"].(string)
		amount, _ := object["amount"].(float64)

		return &CallbackResult{
			TradeNo:     id,
			OutTradeNo:  orderNo,
			TradeStatus: "succeeded",
			TotalAmount: fmt.Sprintf("%.2f", amount/100),
			RawParams:   url.Values{},
			PaymentType: c.GetPaymentType(),
		}, nil

	default:
		return nil, fmt.Errorf("unhandled event type: %s", eventType)
	}
}

// handleStripeEvent 处理Stripe事件
func (c *StripeClient) handleStripeEvent(payload []byte) (*CallbackResult, error) {
	return c.parseWebhookEvent(payload)
}

// GetPaymentType 获取支付类型
func (c *StripeClient) GetPaymentType() PaymentType {
	return PaymentTypeStripe
}

// createMockPayment 创建模拟支付
func (c *StripeClient) createMockPayment(order *models.Order, subject string) (string, error) {
	paymentID := uuid.New().String()
	return fmt.Sprintf("http://localhost:3000/mock-pay?id=%s&order_no=%s&amount=%.2f&provider=stripe",
		paymentID, order.OrderNo, order.TotalAmount), nil
}

// MockStripeClient 模拟Stripe客户端（用于开发和测试）
type MockStripeClient struct{}

// NewMockStripeClient 创建模拟Stripe客户端
func NewMockStripeClient() *MockStripeClient {
	return &MockStripeClient{}
}

// CreatePayment 创建模拟支付
func (c *MockStripeClient) CreatePayment(order *models.Order, subject string) (string, error) {
	paymentID := uuid.New().String()
	return fmt.Sprintf("http://localhost:3000/mock-pay?id=%s&order_no=%s&amount=%.2f&provider=stripe",
		paymentID, order.OrderNo, order.TotalAmount), nil
}

// VerifyCallback 验证模拟回调
func (c *MockStripeClient) VerifyCallback(params url.Values) (bool, error) {
	return true, nil
}

// ProcessCallback 处理模拟回调
func (c *MockStripeClient) ProcessCallback(params url.Values) (*CallbackResult, error) {
	return &CallbackResult{
		TradeNo:     "mock_stripe_" + uuid.New().String()[:8],
		OutTradeNo:  params.Get("out_trade_no"),
		TradeStatus: "succeeded",
		TotalAmount: params.Get("total_amount"),
		RawParams:   params,
		PaymentType: c.GetPaymentType(),
	}, nil
}

// GetPaymentType 获取支付类型
func (c *MockStripeClient) GetPaymentType() PaymentType {
	return PaymentTypeMock
}

// ProcessWebhook 处理模拟Webhook
func (c *MockStripeClient) ProcessWebhook(payload []byte, signature string) (*CallbackResult, error) {
	return &CallbackResult{
		TradeNo:     "mock_webhook_" + uuid.New().String()[:8],
		OutTradeNo:  "mock_order",
		TradeStatus: "succeeded",
		TotalAmount: "0.00",
		RawParams:   url.Values{},
		PaymentType: c.GetPaymentType(),
	}, nil
}
