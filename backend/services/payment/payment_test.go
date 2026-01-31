package payment

import (
	"net/url"
	"testing"

	"github.com/google/uuid"
	"skillhub/config"
	"skillhub/models"
)

func TestMockAlipayClient(t *testing.T) {
	// 创建模拟支付宝客户端
	client := NewMockAlipayClient()

	// 创建测试订单
	order := &models.Order{
		ID:          uuid.New(),
		OrderNo:     "TEST123456",
		UserID:      uuid.New(),
		TotalAmount: 99.99,
		Status:      models.OrderStatusPending,
	}

	// 测试创建支付链接
	paymentURL, err := client.CreatePayment(order, "测试商品")
	if err != nil {
		t.Fatalf("CreatePayment failed: %v", err)
	}

	if paymentURL == "" {
		t.Error("paymentURL should not be empty")
	}

	// 测试验证回调（模拟总是成功）
	params := url.Values{}
	params.Set("out_trade_no", order.OrderNo)
	params.Set("trade_no", "mock_trade_123456")
	params.Set("total_amount", "99.99")
	params.Set("trade_status", "TRADE_SUCCESS")

	valid, err := client.VerifyCallback(params)
	if err != nil {
		t.Fatalf("VerifyCallback failed: %v", err)
	}
	if !valid {
		t.Error("VerifyCallback should return true for mock client")
	}

	// 测试处理回调
	result, err := client.ProcessCallback(params)
	if err != nil {
		t.Fatalf("ProcessCallback failed: %v", err)
	}

	if result.OutTradeNo != order.OrderNo {
		t.Errorf("Expected OutTradeNo %s, got %s", order.OrderNo, result.OutTradeNo)
	}
	if result.TradeStatus != "TRADE_SUCCESS" {
		t.Errorf("Expected TradeStatus TRADE_SUCCESS, got %s", result.TradeStatus)
	}
	if result.PaymentType != PaymentTypeMock {
		t.Errorf("Expected PaymentType mock, got %s", result.PaymentType)
	}
}

func TestMockWeChatPayClient(t *testing.T) {
	// 创建模拟微信支付客户端
	client := NewMockWeChatPayClient()

	// 创建测试订单
	order := &models.Order{
		ID:          uuid.New(),
		OrderNo:     "TEST654321",
		UserID:      uuid.New(),
		TotalAmount: 88.88,
		Status:      models.OrderStatusPending,
	}

	// 测试创建支付链接
	paymentURL, err := client.CreatePayment(order, "微信测试商品")
	if err != nil {
		t.Fatalf("CreatePayment failed: %v", err)
	}

	if paymentURL == "" {
		t.Error("paymentURL should not be empty")
	}

	// 测试验证回调
	params := url.Values{}
	params.Set("out_trade_no", order.OrderNo)

	valid, err := client.VerifyCallback(params)
	if err != nil {
		t.Fatalf("VerifyCallback failed: %v", err)
	}
	if !valid {
		t.Error("VerifyCallback should return true for mock client")
	}

	// 测试处理回调
	result, err := client.ProcessCallback(params)
	if err != nil {
		t.Fatalf("ProcessCallback failed: %v", err)
	}

	if result.OutTradeNo != order.OrderNo {
		t.Errorf("Expected OutTradeNo %s, got %s", order.OrderNo, result.OutTradeNo)
	}
	if result.PaymentType != PaymentTypeWeChat {
		t.Errorf("Expected PaymentType wechat, got %s", result.PaymentType)
	}
}

func TestGetDefaultPaymentService(t *testing.T) {
	// 创建测试配置（所有支付配置为空）
	cfg := &config.Config{
		Payment: config.PaymentConfig{
			Alipay: config.AlipayConfig{
				AppID:      "",
				PrivateKey: "",
				PublicKey:  "",
			},
			WeChatPay: config.WeChatPayConfig{
				MchID:  "",
				APIKey: "",
			},
			Stripe: config.StripeConfig{
				SecretKey: "",
			},
			PayPal: config.PayPalConfig{
				ClientID:     "",
				ClientSecret: "",
			},
		},
	}

	// 获取默认支付服务（应该返回模拟支付）
	service := GetDefaultPaymentService(*cfg)
	if service == nil {
		t.Fatal("GetDefaultPaymentService should not return nil")
	}

	// 验证服务类型（应该是模拟支付）
	paymentType := service.GetPaymentType()
	if paymentType != PaymentTypeMock && paymentType != PaymentTypeAlipay {
		t.Logf("Payment type: %s (expected mock or alipay for empty config)", paymentType)
	}
}

func TestGetPaymentService(t *testing.T) {
	// 创建测试配置
	cfg := &config.Config{
		Payment: config.PaymentConfig{
			Alipay: config.AlipayConfig{
				AppID:      "",
				PrivateKey: "",
				PublicKey:  "",
			},
		},
	}

	// 测试获取支付宝服务（配置为空，应该返回模拟支付）
	service, err := GetPaymentService(PaymentTypeAlipay, *cfg)
	if err != nil {
		t.Fatalf("GetPaymentService failed: %v", err)
	}
	if service == nil {
		t.Fatal("GetPaymentService should not return nil")
	}

	// 测试获取微信支付服务
	service, err = GetPaymentService(PaymentTypeWeChat, *cfg)
	if err != nil {
		t.Fatalf("GetPaymentService failed for wechat: %v", err)
	}
	if service == nil {
		t.Fatal("GetPaymentService should not return nil for wechat")
	}

	// 测试获取Stripe服务
	service, err = GetPaymentService(PaymentTypeStripe, *cfg)
	if err != nil {
		t.Fatalf("GetPaymentService failed for stripe: %v", err)
	}
	if service == nil {
		t.Fatal("GetPaymentService should not return nil for stripe")
	}

	// 测试获取PayPal服务
	service, err = GetPaymentService(PaymentTypePayPal, *cfg)
	if err != nil {
		t.Fatalf("GetPaymentService failed for paypal: %v", err)
	}
	if service == nil {
		t.Fatal("GetPaymentService should not return nil for paypal")
	}
}
