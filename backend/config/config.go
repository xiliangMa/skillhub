package config

import (
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	JWT      JWTConfig
	OAuth    OAuthConfig
	Payment  PaymentConfig
	GitHub   GitHubConfig
}

type ServerConfig struct {
	Port string
	Mode string
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
}

type RedisConfig struct {
	Host     string
	Port     string
	Password string
}

type JWTConfig struct {
	Secret     string
	Expiration time.Duration
}

type OAuthConfig struct {
	WeChat      OAuthProvider
	Feishu      OAuthProvider
	Xiaohongshu OAuthProvider
	GitHub      OAuthProvider
	Google      OAuthProvider
}

type OAuthProvider struct {
	AppID     string
	AppSecret string
	Redirect  string
}

type PaymentConfig struct {
	Alipay    AlipayConfig
	WeChatPay WeChatPayConfig
	Stripe    StripeConfig
	PayPal    PayPalConfig
}

type AlipayConfig struct {
	AppID      string
	PrivateKey string
	PublicKey  string
	NotifyURL  string
}

type WeChatPayConfig struct {
	MchID     string
	APIKey    string
	SerialNo  string
	CertPath  string
	NotifyURL string
}

type StripeConfig struct {
	SecretKey      string
	PublishableKey string
	WebhookSecret  string
}

type PayPalConfig struct {
	ClientID     string
	ClientSecret string
	Mode         string
}

type GitHubConfig struct {
	Token string
}

var AppConfig *Config

func LoadConfig() *Config {
	if err := godotenv.Load("../../.env"); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	return &Config{
		Server: ServerConfig{
			Port: getEnv("BACKEND_PORT", "8080"),
			Mode: getEnv("GIN_MODE", "debug"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "skillhub"),
			Password: getEnv("DB_PASSWORD", "skillhub_password"),
			Name:     getEnv("DB_NAME", "skillhub"),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnv("REDIS_PORT", "6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
		},
		JWT: JWTConfig{
			Secret:     getEnv("JWT_SECRET", "default-secret-change-in-production"),
			Expiration: parseDuration(getEnv("JWT_EXPIRATION", "24h")),
		},
		OAuth: OAuthConfig{
			WeChat: OAuthProvider{
				AppID:     getEnv("WECHAT_APP_ID", ""),
				AppSecret: getEnv("WECHAT_APP_SECRET", ""),
				Redirect:  getEnv("WECHAT_REDIRECT_URI", ""),
			},
			Feishu: OAuthProvider{
				AppID:     getEnv("FEISHU_APP_ID", ""),
				AppSecret: getEnv("FEISHU_APP_SECRET", ""),
				Redirect:  getEnv("FEISHU_REDIRECT_URI", ""),
			},
			Xiaohongshu: OAuthProvider{
				AppID:     getEnv("XIAOHONGSHU_APP_ID", ""),
				AppSecret: getEnv("XIAOHONGSHU_APP_SECRET", ""),
				Redirect:  getEnv("XIAOHONGSHU_REDIRECT_URI", ""),
			},
			GitHub: OAuthProvider{
				AppID:     getEnv("GITHUB_CLIENT_ID", ""),
				AppSecret: getEnv("GITHUB_CLIENT_SECRET", ""),
				Redirect:  getEnv("GITHUB_REDIRECT_URI", ""),
			},
			Google: OAuthProvider{
				AppID:     getEnv("GOOGLE_CLIENT_ID", ""),
				AppSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
				Redirect:  getEnv("GOOGLE_REDIRECT_URI", ""),
			},
		},
		Payment: PaymentConfig{
			Alipay: AlipayConfig{
				AppID:      getEnv("ALIPAY_APP_ID", ""),
				PrivateKey: getEnv("ALIPAY_PRIVATE_KEY", ""),
				PublicKey:  getEnv("ALIPAY_PUBLIC_KEY", ""),
				NotifyURL:  getEnv("ALIPAY_NOTIFY_URL", ""),
			},
			WeChatPay: WeChatPayConfig{
				MchID:     getEnv("WECHAT_PAY_MCH_ID", ""),
				APIKey:    getEnv("WECHAT_PAY_API_KEY", ""),
				SerialNo:  getEnv("WECHAT_PAY_SERIAL_NO", ""),
				CertPath:  getEnv("WECHAT_PAY_CERT_PATH", ""),
				NotifyURL: getEnv("WECHAT_PAY_NOTIFY_URL", ""),
			},
			Stripe: StripeConfig{
				SecretKey:      getEnv("STRIPE_SECRET_KEY", ""),
				PublishableKey: getEnv("STRIPE_PUBLISHABLE_KEY", ""),
				WebhookSecret:  getEnv("STRIPE_WEBHOOK_SECRET", ""),
			},
			PayPal: PayPalConfig{
				ClientID:     getEnv("PAYPAL_CLIENT_ID", ""),
				ClientSecret: getEnv("PAYPAL_CLIENT_SECRET", ""),
				Mode:         getEnv("PAYPAL_MODE", "sandbox"),
			},
		},
		GitHub: GitHubConfig{
			Token: getEnv("GITHUB_TOKEN", ""),
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func parseDuration(s string) time.Duration {
	d, err := time.ParseDuration(s)
	if err != nil {
		return 24 * time.Hour
	}
	return d
}
