package payment

import (
	"crypto"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"fmt"
	"net/url"
	"sort"
	"strings"
	"time"

	"skillhub/config"
	"skillhub/models"

	"github.com/google/uuid"
)

// AlipayClient 支付宝客户端
type AlipayClient struct {
	AppID      string
	PrivateKey *rsa.PrivateKey
	PublicKey  *rsa.PublicKey
	NotifyURL  string
	ReturnURL  string
}

// NewAlipayClient 创建支付宝客户端
func NewAlipayClient(cfg config.AlipayConfig) (*AlipayClient, error) {
	if cfg.AppID == "" || cfg.PrivateKey == "" || cfg.PublicKey == "" {
		return nil, errors.New("alipay config is incomplete")
	}

	// 解析私钥
	privateKey, err := parsePrivateKey(cfg.PrivateKey)
	if err != nil {
		return nil, fmt.Errorf("failed to parse private key: %w", err)
	}

	// 解析公钥
	publicKey, err := parsePublicKey(cfg.PublicKey)
	if err != nil {
		return nil, fmt.Errorf("failed to parse public key: %w", err)
	}

	returnURL := cfg.ReturnURL
	if returnURL == "" {
		returnURL = "http://localhost:3000/orders" // 默认返回URL
	}
	return &AlipayClient{
		AppID:      cfg.AppID,
		PrivateKey: privateKey,
		PublicKey:  publicKey,
		NotifyURL:  cfg.NotifyURL,
		ReturnURL:  returnURL,
	}, nil
}

// CreatePayment 创建支付宝支付
func (c *AlipayClient) CreatePayment(order *models.Order, subject string) (string, error) {
	params := map[string]string{
		"app_id":        c.AppID,
		"method":        "alipay.trade.page.pay",
		"charset":       "utf-8",
		"sign_type":     "RSA2",
		"timestamp":     time.Now().Format("2006-01-02 15:04:05"),
		"version":       "1.0",
		"notify_url":    c.NotifyURL,
		"return_url":    c.ReturnURL,
		"biz_content":   buildBizContent(order, subject),
		"out_trade_no":  order.OrderNo,
		"total_amount":  fmt.Sprintf("%.2f", order.TotalAmount),
		"subject":       subject,
		"product_code":  "FAST_INSTANT_TRADE_PAY",
	}

	// 生成签名
	sign, err := c.sign(params)
	if err != nil {
		return "", fmt.Errorf("failed to sign: %w", err)
	}
	params["sign"] = sign

	// 构建支付URL
	values := url.Values{}
	for k, v := range params {
		values.Set(k, v)
	}

	return "https://openapi.alipay.com/gateway.do?" + values.Encode(), nil
}

// VerifyCallback 验证支付宝回调签名
func (c *AlipayClient) VerifyCallback(params url.Values) (bool, error) {
	sign := params.Get("sign")
	signType := params.Get("sign_type")

	if sign == "" || signType != "RSA2" {
		return false, errors.New("invalid sign or sign_type")
	}

	// 移除sign和sign_type参数
	params.Del("sign")
	params.Del("sign_type")

	// 构建待签名字符串
	signContent := buildSignContent(params)

	// Base64解码签名
	signBytes, err := base64.StdEncoding.DecodeString(sign)
	if err != nil {
		return false, fmt.Errorf("failed to decode sign: %w", err)
	}

	// 验证签名
	hashed := sha256.Sum256([]byte(signContent))
	err = rsa.VerifyPKCS1v15(c.PublicKey, crypto.SHA256, hashed[:], signBytes)
	if err != nil {
		return false, fmt.Errorf("signature verification failed: %w", err)
	}

	return true, nil
}

// ProcessCallback 处理支付宝回调
func (c *AlipayClient) ProcessCallback(params url.Values) (*CallbackResult, error) {
	// 验证签名
	valid, err := c.VerifyCallback(params)
	if !valid || err != nil {
		return nil, fmt.Errorf("callback verification failed: %w", err)
	}

	// 解析回调参数
	tradeNo := params.Get("trade_no")
	outTradeNo := params.Get("out_trade_no")
	tradeStatus := params.Get("trade_status")
	totalAmount := params.Get("total_amount")

	if tradeNo == "" || outTradeNo == "" || tradeStatus == "" {
		return nil, errors.New("missing required callback parameters")
	}

	result := &CallbackResult{
		TradeNo:     tradeNo,
		OutTradeNo:  outTradeNo,
		TradeStatus: tradeStatus,
		TotalAmount: totalAmount,
		RawParams:   params,
		PaymentType: c.GetPaymentType(),
	}

	return result, nil
}

// GetPaymentType 获取支付类型
func (c *AlipayClient) GetPaymentType() PaymentType {
	return PaymentTypeAlipay
}

// CallbackResult 已经在payment.go中定义，这里不再重复定义

// buildBizContent 构建业务参数
func buildBizContent(order *models.Order, subject string) string {
	return fmt.Sprintf(`{
		"out_trade_no": "%s",
		"total_amount": "%.2f",
		"subject": "%s",
		"product_code": "FAST_INSTANT_TRADE_PAY",
		"timeout_express": "30m"
	}`, order.OrderNo, order.TotalAmount, subject)
}

// sign 生成签名
func (c *AlipayClient) sign(params map[string]string) (string, error) {
	// 构建待签名字符串
	signContent := buildSignContentFromMap(params)

	// 使用SHA256WithRSA签名
	hashed := sha256.Sum256([]byte(signContent))
	signature, err := rsa.SignPKCS1v15(nil, c.PrivateKey, crypto.SHA256, hashed[:])
	if err != nil {
		return "", err
	}

	return base64.StdEncoding.EncodeToString(signature), nil
}

// buildSignContentFromMap 从map构建待签名字符串
func buildSignContentFromMap(params map[string]string) string {
	var keys []string
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var pairs []string
	for _, k := range keys {
		if v := params[k]; v != "" {
			pairs = append(pairs, k+"="+v)
		}
	}

	return strings.Join(pairs, "&")
}

// buildSignContent 从url.Values构建待签名字符串
func buildSignContent(values url.Values) string {
	var keys []string
	for k := range values {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var pairs []string
	for _, k := range keys {
		if v := values.Get(k); v != "" {
			pairs = append(pairs, k+"="+v)
		}
	}

	return strings.Join(pairs, "&")
}

// parsePrivateKey 解析RSA私钥
func parsePrivateKey(key string) (*rsa.PrivateKey, error) {
	// 如果key是PEM格式，解码
	if strings.Contains(key, "-----BEGIN") {
		block, _ := pem.Decode([]byte(key))
		if block == nil {
			return nil, errors.New("failed to parse PEM block")
		}
		key = string(block.Bytes)
	}

	// Base64解码
	keyBytes, err := base64.StdEncoding.DecodeString(key)
	if err != nil {
		// 如果不是Base64，直接使用
		keyBytes = []byte(key)
	}

	// 尝试解析PKCS1
	privateKey, err := x509.ParsePKCS1PrivateKey(keyBytes)
	if err == nil {
		return privateKey, nil
	}

	// 尝试解析PKCS8
	pkcs8Key, err := x509.ParsePKCS8PrivateKey(keyBytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse private key: %w", err)
	}

	rsaKey, ok := pkcs8Key.(*rsa.PrivateKey)
	if !ok {
		return nil, errors.New("not an RSA private key")
	}

	return rsaKey, nil
}

// parsePublicKey 解析RSA公钥
func parsePublicKey(key string) (*rsa.PublicKey, error) {
	// 如果key是PEM格式，解码
	if strings.Contains(key, "-----BEGIN") {
		block, _ := pem.Decode([]byte(key))
		if block == nil {
			return nil, errors.New("failed to parse PEM block")
		}
		key = string(block.Bytes)
	}

	// Base64解码
	keyBytes, err := base64.StdEncoding.DecodeString(key)
	if err != nil {
		// 如果不是Base64，直接使用
		keyBytes = []byte(key)
	}

	// 尝试解析PKIX
	publicKey, err := x509.ParsePKIXPublicKey(keyBytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse public key: %w", err)
	}

	rsaKey, ok := publicKey.(*rsa.PublicKey)
	if !ok {
		return nil, errors.New("not an RSA public key")
	}

	return rsaKey, nil
}

// MockAlipayClient 模拟支付宝客户端（用于开发和测试）
type MockAlipayClient struct{}

// NewMockAlipayClient 创建模拟支付宝客户端
func NewMockAlipayClient() *MockAlipayClient {
	return &MockAlipayClient{}
}

// CreatePayment 创建模拟支付
func (c *MockAlipayClient) CreatePayment(order *models.Order, subject string) (string, error) {
	// 生成模拟支付URL
	paymentID := uuid.New().String()
	return fmt.Sprintf("http://localhost:3000/mock-pay?id=%s&order_no=%s&amount=%.2f",
		paymentID, order.OrderNo, order.TotalAmount), nil
}

// VerifyCallback 验证模拟回调
func (c *MockAlipayClient) VerifyCallback(params url.Values) (bool, error) {
	// 模拟验证总是成功
	return true, nil
}

// ProcessCallback 处理模拟回调
func (c *MockAlipayClient) ProcessCallback(params url.Values) (*CallbackResult, error) {
	return &CallbackResult{
		TradeNo:     "mock_trade_" + uuid.New().String()[:8],
		OutTradeNo:  params.Get("out_trade_no"),
		TradeStatus: "TRADE_SUCCESS",
		TotalAmount: params.Get("total_amount"),
		RawParams:   params,
		PaymentType: c.GetPaymentType(),
	}, nil
}

// GetPaymentType 获取支付类型
func (c *MockAlipayClient) GetPaymentType() PaymentType {
	return PaymentTypeMock
}

// GetPaymentService 已经在payment.go中定义，这里不再重复定义