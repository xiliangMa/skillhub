package payment

import (
	"fmt"
	"net/url"
	"strings"

	"skillhub/config"
	"skillhub/models"

	"github.com/google/uuid"
)

// WeChatPayClient 微信支付客户端
type WeChatPayClient struct {
	MchID     string
	APIKey    string
	SerialNo  string
	CertPath  string
	NotifyURL string
	ReturnURL string
}

// NewWeChatPayClient 创建微信支付客户端
func NewWeChatPayClient(cfg config.WeChatPayConfig) (*WeChatPayClient, error) {
	if cfg.MchID == "" || cfg.APIKey == "" {
		return nil, fmt.Errorf("wechat pay config is incomplete")
	}

	returnURL := cfg.ReturnURL
	if returnURL == "" {
		returnURL = "http://localhost:3000/orders" // 默认返回URL
	}

	return &WeChatPayClient{
		MchID:     cfg.MchID,
		APIKey:    cfg.APIKey,
		SerialNo:  cfg.SerialNo,
		CertPath:  cfg.CertPath,
		NotifyURL: cfg.NotifyURL,
		ReturnURL: returnURL,
	}, nil
}

// CreatePayment 创建微信支付
func (c *WeChatPayClient) CreatePayment(order *models.Order, subject string) (string, error) {
	// 如果配置不完整，返回模拟支付URL
	if c.MchID == "" || c.APIKey == "" || c.SerialNo == "" {
		return c.createMockPayment(order, subject)
	}

	// TODO: 实现真实的微信支付API调用
	// 这里暂时使用模拟支付
	return c.createMockPayment(order, subject)
}

// VerifyCallback 验证微信支付回调签名
func (c *WeChatPayClient) VerifyCallback(params url.Values) (bool, error) {
	// 如果配置不完整，模拟验证总是成功
	if c.MchID == "" || c.APIKey == "" {
		return true, nil
	}

	// TODO: 实现微信支付回调签名验证
	// 微信支付使用APIv3的签名验证，需要验证HTTP头中的签名和时间戳
	return true, nil
}

// ProcessCallback 处理微信支付回调
func (c *WeChatPayClient) ProcessCallback(params url.Values) (*CallbackResult, error) {
	// 验证签名
	valid, err := c.VerifyCallback(params)
	if !valid || err != nil {
		return nil, fmt.Errorf("callback verification failed: %w", err)
	}

	// 解析回调参数
	// 微信支付回调格式与支付宝不同，需要适配
	tradeNo := params.Get("transaction_id")
	outTradeNo := params.Get("out_trade_no")
	tradeStatus := params.Get("trade_state")
	totalAmount := params.Get("amount.total")

	// 如果参数为空，尝试从模拟参数获取
	if tradeNo == "" {
		tradeNo = params.Get("trade_no")
	}
	if outTradeNo == "" {
		outTradeNo = params.Get("out_trade_no")
	}
	if tradeStatus == "" {
		tradeStatus = params.Get("trade_status")
		if tradeStatus == "" {
			tradeStatus = "SUCCESS" // 默认成功
		}
	}
	if totalAmount == "" {
		totalAmount = params.Get("total_fee")
	}

	// 转换微信支付状态到统一状态
	unifiedStatus := c.mapWeChatStatusToUnified(tradeStatus)

	result := &CallbackResult{
		TradeNo:     tradeNo,
		OutTradeNo:  outTradeNo,
		TradeStatus: unifiedStatus,
		TotalAmount: totalAmount,
		RawParams:   params,
		PaymentType: c.GetPaymentType(),
	}

	return result, nil
}

// GetPaymentType 获取支付类型
func (c *WeChatPayClient) GetPaymentType() PaymentType {
	return PaymentTypeWeChat
}

// createMockPayment 创建模拟支付
func (c *WeChatPayClient) createMockPayment(order *models.Order, subject string) (string, error) {
	// 生成模拟支付URL
	paymentID := uuid.New().String()
	return fmt.Sprintf("http://localhost:3000/mock-pay?type=wechat&id=%s&order_no=%s&amount=%.2f",
		paymentID, order.OrderNo, order.TotalAmount), nil
}

// mapWeChatStatusToUnified 映射微信支付状态到统一状态
func (c *WeChatPayClient) mapWeChatStatusToUnified(wechatStatus string) string {
	// 微信支付状态映射
	switch wechatStatus {
	case "SUCCESS":
		return "TRADE_SUCCESS"
	case "REFUND":
		return "TRADE_REFUND"
	case "NOTPAY":
		return "WAIT_BUYER_PAY"
	case "CLOSED":
		return "TRADE_CLOSED"
	case "REVOKED":
		return "TRADE_CANCELLED"
	case "USERPAYING":
		return "WAIT_BUYER_PAY"
	case "PAYERROR":
		return "TRADE_FAILED"
	default:
		return strings.ToUpper(wechatStatus)
	}
}

// MockWeChatPayClient 模拟微信支付客户端（用于开发和测试）
type MockWeChatPayClient struct{}

// NewMockWeChatPayClient 创建模拟微信支付客户端
func NewMockWeChatPayClient() *MockWeChatPayClient {
	return &MockWeChatPayClient{}
}

// CreatePayment 创建模拟支付
func (c *MockWeChatPayClient) CreatePayment(order *models.Order, subject string) (string, error) {
	paymentID := uuid.New().String()
	return fmt.Sprintf("http://localhost:3000/mock-pay?type=wechat&id=%s&order_no=%s&amount=%.2f",
		paymentID, order.OrderNo, order.TotalAmount), nil
}

// VerifyCallback 验证模拟回调
func (c *MockWeChatPayClient) VerifyCallback(params url.Values) (bool, error) {
	return true, nil
}

// ProcessCallback 处理模拟回调
func (c *MockWeChatPayClient) ProcessCallback(params url.Values) (*CallbackResult, error) {
	return &CallbackResult{
		TradeNo:     "wechat_mock_trade_" + uuid.New().String()[:8],
		OutTradeNo:  params.Get("out_trade_no"),
		TradeStatus: "TRADE_SUCCESS",
		TotalAmount: params.Get("total_amount"),
		RawParams:   params,
		PaymentType: PaymentTypeWeChat,
	}, nil
}

// GetPaymentType 获取支付类型
func (c *MockWeChatPayClient) GetPaymentType() PaymentType {
	return PaymentTypeWeChat
}