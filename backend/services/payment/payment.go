package payment

import (
	"net/url"

	"skillhub/config"
	"skillhub/models"
)

// PaymentService 统一支付服务接口
type PaymentService interface {
	// CreatePayment 创建支付链接
	CreatePayment(order *models.Order, subject string) (string, error)
	// VerifyCallback 验证支付回调签名
	VerifyCallback(params url.Values) (bool, error)
	// ProcessCallback 处理支付回调
	ProcessCallback(params url.Values) (*CallbackResult, error)
	// GetPaymentType 获取支付类型
	GetPaymentType() PaymentType
}

// PaymentType 支付类型枚举
type PaymentType string

const (
	PaymentTypeAlipay    PaymentType = "alipay"
	PaymentTypeWeChat    PaymentType = "wechat"
	PaymentTypeStripe    PaymentType = "stripe"
	PaymentTypePayPal    PaymentType = "paypal"
	PaymentTypeMock      PaymentType = "mock"
)

// CallbackResult 支付回调结果
type CallbackResult struct {
	TradeNo     string      `json:"trade_no"`
	OutTradeNo  string      `json:"out_trade_no"`
	TradeStatus string      `json:"trade_status"`
	TotalAmount string      `json:"total_amount"`
	RawParams   url.Values  `json:"raw_params"`
	PaymentType PaymentType `json:"payment_type"`
}

// Config, AlipayConfig, WeChatPayConfig 等类型在 config 包中定义，这里不再重复定义

// GetPaymentService 获取支付服务（工厂函数）
func GetPaymentService(paymentType PaymentType, cfg config.Config) (PaymentService, error) {
	switch paymentType {
	case PaymentTypeAlipay:
		alipayCfg := cfg.Payment.Alipay
		if alipayCfg.AppID == "" || alipayCfg.PrivateKey == "" || alipayCfg.PublicKey == "" {
			return NewMockAlipayClient(), nil
		}
		return NewAlipayClient(alipayCfg)
	case PaymentTypeWeChat:
		// 如果配置完整，使用真实微信支付客户端
		wechatCfg := cfg.Payment.WeChatPay
		if wechatCfg.MchID != "" && wechatCfg.APIKey != "" {
			client, err := NewWeChatPayClient(wechatCfg)
			if err == nil {
				return client, nil
			}
		}
		// 否则使用模拟微信支付客户端
		return NewMockWeChatPayClient(), nil
	case PaymentTypeStripe:
		stripeCfg := cfg.Payment.Stripe
		if stripeCfg.SecretKey == "" {
			return NewMockStripeClient(), nil
		}
		return NewStripeClient(stripeCfg)
	case PaymentTypePayPal:
		paypalCfg := cfg.Payment.PayPal
		if paypalCfg.ClientID == "" || paypalCfg.ClientSecret == "" {
			return NewMockPayPalClient(), nil
		}
		return NewPayPalClient(paypalCfg)
	default:
		return NewMockAlipayClient(), nil
	}
}

// GetDefaultPaymentService 获取默认支付服务（根据配置自动选择）
func GetDefaultPaymentService(cfg config.Config) PaymentService {
	// 优先使用支付宝
	alipayCfg := cfg.Payment.Alipay
	if alipayCfg.AppID != "" && alipayCfg.PrivateKey != "" && alipayCfg.PublicKey != "" {
		client, err := NewAlipayClient(alipayCfg)
		if err == nil {
			return client
		}
	}

	// 其次使用微信支付
	wechatCfg := cfg.Payment.WeChatPay
	if wechatCfg.MchID != "" && wechatCfg.APIKey != "" {
		client, err := NewWeChatPayClient(wechatCfg)
		if err == nil {
			return client
		}
	}

	// 然后使用Stripe
	stripeCfg := cfg.Payment.Stripe
	if stripeCfg.SecretKey != "" {
		client, err := NewStripeClient(stripeCfg)
		if err == nil {
			return client
		}
	}

	// 最后使用PayPal
	paypalCfg := cfg.Payment.PayPal
	if paypalCfg.ClientID != "" && paypalCfg.ClientSecret != "" {
		client, err := NewPayPalClient(paypalCfg)
		if err == nil {
			return client
		}
	}

	// 使用模拟支付作为后备
	return NewMockAlipayClient()
}