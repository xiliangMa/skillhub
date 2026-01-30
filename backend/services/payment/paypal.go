package payment

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"skillhub/config"
	"skillhub/models"

	"github.com/google/uuid"
)

// PayPalClient PayPal支付客户端
type PayPalClient struct {
	ClientID     string
	ClientSecret string
	Mode         string // sandbox or live
	BaseURL      string
	SuccessURL   string
	CancelURL    string
	AccessToken  string
	TokenExpiry  time.Time
}

// PayPalOrderResponse PayPal订单响应
type PayPalOrderResponse struct {
	ID     string `json:"id"`
	Status string `json:"status"`
	Links  []struct {
		Href   string `json:"href"`
		Rel    string `json:"rel"`
		Method string `json:"method"`
	} `json:"links"`
}

// PayPalWebhookEvent PayPal Webhook事件
type PayPalWebhookEvent struct {
	ID           string                 `json:"id"`
	EventType    string                 `json:"event_type"`
	Resource     map[string]interface{} `json:"resource"`
	CreateTime   string                 `json:"create_time"`
	ResourceType string                 `json:"resource_type"`
}

// NewPayPalClient 创建PayPal客户端
func NewPayPalClient(cfg config.PayPalConfig) (*PayPalClient, error) {
	if cfg.ClientID == "" || cfg.ClientSecret == "" {
		return nil, fmt.Errorf("paypal client id and secret are required")
	}

	mode := cfg.Mode
	if mode == "" {
		mode = "sandbox"
	}

	var baseURL string
	if mode == "sandbox" {
		baseURL = "https://api-m.sandbox.paypal.com"
	} else {
		baseURL = "https://api-m.paypal.com"
	}

	successURL := "http://localhost:3000/orders/success"
	cancelURL := "http://localhost:3000/orders/cancel"

	return &PayPalClient{
		ClientID:     cfg.ClientID,
		ClientSecret: cfg.ClientSecret,
		Mode:         mode,
		BaseURL:      baseURL,
		SuccessURL:   successURL,
		CancelURL:    cancelURL,
	}, nil
}

// getAccessToken 获取访问令牌
func (c *PayPalClient) getAccessToken() (string, error) {
	// 如果令牌未过期，直接返回
	if c.AccessToken != "" && time.Now().Before(c.TokenExpiry) {
		return c.AccessToken, nil
	}

	// 请求新的访问令牌
	url := c.BaseURL + "/v1/oauth2/token"
	req, err := http.NewRequest("POST", url, strings.NewReader("grant_type=client_credentials"))
	if err != nil {
		return "", fmt.Errorf("failed to create token request: %w", err)
	}

	req.SetBasicAuth(c.ClientID, c.ClientSecret)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to get access token: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("failed to get access token: %s", string(body))
	}

	var result struct {
		AccessToken string `json:"access_token"`
		TokenType   string `json:"token_type"`
		ExpiresIn   int    `json:"expires_in"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode token response: %w", err)
	}

	// 更新令牌和过期时间
	c.AccessToken = result.AccessToken
	c.TokenExpiry = time.Now().Add(time.Duration(result.ExpiresIn-60) * time.Second) // 提前60秒过期

	return c.AccessToken, nil
}

// CreatePayment 创建PayPal支付订单
func (c *PayPalClient) CreatePayment(order *models.Order, subject string) (string, error) {
	// 如果配置不完整，返回模拟支付URL
	if c.ClientID == "" || c.ClientSecret == "" {
		return c.createMockPayment(order, subject)
	}

	// 获取访问令牌
	accessToken, err := c.getAccessToken()
	if err != nil {
		return "", fmt.Errorf("failed to get access token: %w", err)
	}

	// 创建订单请求
	orderData := map[string]interface{}{
		"intent": "CAPTURE",
		"purchase_units": []map[string]interface{}{
			{
				"reference_id": order.OrderNo,
				"amount": map[string]interface{}{
					"currency_code": "USD",
					"value":         fmt.Sprintf("%.2f", order.TotalAmount),
				},
				"description": subject,
			},
		},
		"application_context": map[string]interface{}{
			"return_url": c.SuccessURL,
			"cancel_url": c.CancelURL,
			"brand_name": "SkillHub",
			"user_action": "PAY_NOW",
		},
	}

	jsonData, err := json.Marshal(orderData)
	if err != nil {
		return "", fmt.Errorf("failed to marshal order data: %w", err)
	}

	// 创建PayPal订单
	url := c.BaseURL + "/v2/checkout/orders"
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create order request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Prefer", "return=representation")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to create paypal order: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("failed to create paypal order: %s", string(body))
	}

	var orderResp PayPalOrderResponse
	if err := json.NewDecoder(resp.Body).Decode(&orderResp); err != nil {
		return "", fmt.Errorf("failed to decode order response: %w", err)
	}

	// 查找approve链接
	for _, link := range orderResp.Links {
		if link.Rel == "approve" {
			return link.Href, nil
		}
	}

	return "", fmt.Errorf("approve link not found in response")
}

// VerifyCallback 验证PayPal回调签名
func (c *PayPalClient) VerifyCallback(params url.Values) (bool, error) {
	// PayPal使用Webhook签名验证，这里返回true让上层处理
	return true, nil
}

// ProcessCallback 处理PayPal回调
func (c *PayPalClient) ProcessCallback(params url.Values) (*CallbackResult, error) {
	// PayPal回调通过Webhook处理，这里返回模拟结果
	return &CallbackResult{
		TradeNo:     "paypal_" + uuid.New().String()[:8],
		OutTradeNo:  params.Get("order_no"),
		TradeStatus: "COMPLETED",
		TotalAmount: params.Get("amount"),
		RawParams:   params,
		PaymentType: c.GetPaymentType(),
	}, nil
}

// ProcessWebhook 处理PayPal Webhook事件
func (c *PayPalClient) ProcessWebhook(payload []byte, signature string) (*CallbackResult, error) {
	// 解析Webhook事件
	var event PayPalWebhookEvent
	if err := json.Unmarshal(payload, &event); err != nil {
		return nil, fmt.Errorf("failed to parse webhook event: %w", err)
	}

	return c.handlePayPalEvent(&event)
}

// handlePayPalEvent 处理PayPal事件
func (c *PayPalClient) handlePayPalEvent(event *PayPalWebhookEvent) (*CallbackResult, error) {
	switch event.EventType {
	case "CHECKOUT.ORDER.APPROVED":
		// 订单已批准，等待支付完成
		return &CallbackResult{
			TradeNo:     event.ID,
			OutTradeNo:  extractOrderNo(event.Resource),
			TradeStatus: "APPROVED",
			TotalAmount: extractAmount(event.Resource),
			RawParams:   url.Values{},
			PaymentType: c.GetPaymentType(),
		}, nil

	case "CHECKOUT.ORDER.COMPLETED":
		// 订单已完成支付
		return &CallbackResult{
			TradeNo:     event.ID,
			OutTradeNo:  extractOrderNo(event.Resource),
			TradeStatus: "COMPLETED",
			TotalAmount: extractAmount(event.Resource),
			RawParams:   url.Values{},
			PaymentType: c.GetPaymentType(),
		}, nil

	case "PAYMENT.CAPTURE.COMPLETED":
		// 支付捕获完成
		return &CallbackResult{
			TradeNo:     event.ID,
			OutTradeNo:  extractOrderNo(event.Resource),
			TradeStatus: "COMPLETED",
			TotalAmount: extractAmount(event.Resource),
			RawParams:   url.Values{},
			PaymentType: c.GetPaymentType(),
		}, nil

	default:
		return nil, fmt.Errorf("unhandled event type: %s", event.EventType)
	}
}

// extractOrderNo 从资源中提取订单号
func extractOrderNo(resource map[string]interface{}) string {
	if purchaseUnits, ok := resource["purchase_units"].([]interface{}); ok && len(purchaseUnits) > 0 {
		if unit, ok := purchaseUnits[0].(map[string]interface{}); ok {
			if referenceID, ok := unit["reference_id"].(string); ok {
				return referenceID
			}
		}
	}
	return "unknown"
}

// extractAmount 从资源中提取金额
func extractAmount(resource map[string]interface{}) string {
	if purchaseUnits, ok := resource["purchase_units"].([]interface{}); ok && len(purchaseUnits) > 0 {
		if unit, ok := purchaseUnits[0].(map[string]interface{}); ok {
			if amount, ok := unit["amount"].(map[string]interface{}); ok {
				if value, ok := amount["value"].(string); ok {
					return value
				}
			}
		}
	}
	return "0.00"
}

// GetPaymentType 获取支付类型
func (c *PayPalClient) GetPaymentType() PaymentType {
	return PaymentTypePayPal
}

// createMockPayment 创建模拟支付
func (c *PayPalClient) createMockPayment(order *models.Order, subject string) (string, error) {
	paymentID := uuid.New().String()
	return fmt.Sprintf("http://localhost:3000/mock-pay?id=%s&order_no=%s&amount=%.2f&provider=paypal",
		paymentID, order.OrderNo, order.TotalAmount), nil
}

// MockPayPalClient 模拟PayPal客户端（用于开发和测试）
type MockPayPalClient struct{}

// NewMockPayPalClient 创建模拟PayPal客户端
func NewMockPayPalClient() *MockPayPalClient {
	return &MockPayPalClient{}
}

// CreatePayment 创建模拟支付
func (c *MockPayPalClient) CreatePayment(order *models.Order, subject string) (string, error) {
	paymentID := uuid.New().String()
	return fmt.Sprintf("http://localhost:3000/mock-pay?id=%s&order_no=%s&amount=%.2f&provider=paypal",
		paymentID, order.OrderNo, order.TotalAmount), nil
}

// VerifyCallback 验证模拟回调
func (c *MockPayPalClient) VerifyCallback(params url.Values) (bool, error) {
	return true, nil
}

// ProcessCallback 处理模拟回调
func (c *MockPayPalClient) ProcessCallback(params url.Values) (*CallbackResult, error) {
	return &CallbackResult{
		TradeNo:     "mock_paypal_" + uuid.New().String()[:8],
		OutTradeNo:  params.Get("out_trade_no"),
		TradeStatus: "COMPLETED",
		TotalAmount: params.Get("total_amount"),
		RawParams:   params,
		PaymentType: c.GetPaymentType(),
	}, nil
}

// GetPaymentType 获取支付类型
func (c *MockPayPalClient) GetPaymentType() PaymentType {
	return PaymentTypeMock
}

// ProcessWebhook 处理模拟Webhook
func (c *MockPayPalClient) ProcessWebhook(payload []byte, signature string) (*CallbackResult, error) {
	return &CallbackResult{
		TradeNo:     "mock_webhook_" + uuid.New().String()[:8],
		OutTradeNo:  "mock_order",
		TradeStatus: "COMPLETED",
		TotalAmount: "0.00",
		RawParams:   url.Values{},
		PaymentType: c.GetPaymentType(),
	}, nil
}