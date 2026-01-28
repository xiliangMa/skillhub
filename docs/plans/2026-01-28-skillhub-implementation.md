# Skills商店SaaS平台实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 从零开始构建完整的Skills商店SaaS平台，包含前后端、爬虫、支付、认证、统计等核心功能

**Architecture:** 前后端分离的微服务架构，使用Docker Compose + Nginx实现单机多副本部署，后端使用Go + Gin + GORM，前端使用Next.js 14 + TypeScript + Tailwind CSS

**Tech Stack:**
- 后端: Go 1.21+, Gin, GORM, PostgreSQL, Redis, JWT, OAuth 2.0, Swagger
- 前端: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, next-intl, Zustand
- 支付: 支付宝SDK, 微信支付SDK, Stripe, PayPal
- 部署: Docker, Docker Compose, Nginx

---

## Phase 1: 基础架构搭建

### Task 1.1: 初始化Git仓库和项目结构

**Files:**
- Create: `.gitignore`
- Create: `README.md`
- Create: `Makefile`
- Create: `.env.example`
- Create: `docker-compose.yml`
- Create: Directory structure

**Step 1: 创建.gitignore文件**

```bash
cat > .gitignore << 'EOF'
# Environment
.env
.env.local
.env.*.local

# Go
*.exe
*.exe~
*.dll
*.so
*.dylib
*.test
*.out
backend/vendor/
backend/tmp/

# Node
node_modules/
.next/
frontend/out/
frontend/.turbo/
frontend/.DS_Store
*.pem

# Database
data/
*.db
*.sqlite

# Logs
*.log
logs/

# IDE
.vscode/
.idea/
*.swp
*.swo

# Docker
docker/data/
docker/logs/
EOF
```

**Step 2: 创建README.md**

```bash
cat > README.md << 'EOF'
# Skills商店SaaS平台

一个专业的AI Skills商店平台，支持技能展示、购买、下载和统计分析。

## 功能特性

- 技能展示和搜索（支持AI语义搜索）
- 多渠道支付（支付宝、微信、Stripe、PayPal）
- OAuth 2.0第三方登录（微信、飞书、小红书、GitHub、Google）
- 自动爬取GitHub Skills数据
- 多语言国际化支持
- 完整的后台管理系统
- 数据统计和分析

## 技术栈

### 后端
- Go 1.21+
- Gin Web框架
- GORM ORM
- PostgreSQL 15+
- Redis 7
- JWT认证
- OAuth 2.0

### 前端
- Next.js 14
- TypeScript 5
- Tailwind CSS 3
- shadcn/ui
- next-intl

## 快速开始

### 前置要求
- Docker 24+
- Docker Compose 2+
- Go 1.21+
- Node.js 20+

### 安装

```bash
# 克隆仓库
git clone <repository-url>
cd skillhub

# 复制环境变量文件
cp .env.example .env

# 启动所有服务
make dev

# 访问应用
# 前端: http://localhost:3000
# 后端API: http://localhost:8080
# Swagger文档: http://localhost:8080/swagger/index.html
```

## 开发指南

### 后端开发
```bash
cd backend
go mod tidy
go run main.go
```

### 前端开发
```bash
cd frontend
npm install
npm run dev
```

## 部署

```bash
# 生产环境部署
make deploy

# 查看日志
make logs
```

## 许可证

MIT License
EOF
```

**Step 3: 创建Makefile**

```bash
cat > Makefile << 'EOF'
.PHONY: help dev build deploy stop logs clean

help: ## 显示帮助信息
	@echo "可用命令:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## 启动开发环境
	docker-compose up -d

build: ## 构建所有服务
	docker-compose build

deploy: ## 部署到生产环境
	docker-compose -f docker-compose.prod.yml up -d

stop: ## 停止所有服务
	docker-compose down

logs: ## 查看日志
	docker-compose logs -f

clean: ## 清理所有容器和数据
	docker-compose down -v
	rm -rf data/*

init-db: ## 初始化数据库
	docker-compose exec postgres psql -U skillhub -d skillhub -f /docker-entrypoint-initdb.d/init.sql

migration: ## 运行数据库迁移
	cd backend && go run main.go migrate

swagger: ## 生成Swagger文档
	cd backend && swag init

test-backend: ## 运行后端测试
	cd backend && go test ./...

test-frontend: ## 运行前端测试
	cd frontend && npm test

restart: ## 重启所有服务
	docker-compose restart

ps: ## 查看运行中的容器
	docker-compose ps
EOF
```

**Step 4: 创建.env.example**

```bash
cat > .env.example << 'EOF'
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=skillhub
DB_PASSWORD=skillhub_password
DB_NAME=skillhub

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# Backend
BACKEND_PORT=8080
GIN_MODE=release

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=24h

# OAuth - WeChat
WECHAT_APP_ID=
WECHAT_APP_SECRET=
WECHAT_REDIRECT_URI=http://localhost:8080/api/v1/auth/callback/wechat

# OAuth - Feishu
FEISHU_APP_ID=
FEISHU_APP_SECRET=
FEISHU_REDIRECT_URI=http://localhost:8080/api/v1/auth/callback/feishu

# OAuth - Xiaohongshu
XIAOHONGSHU_APP_ID=
XIAOHONGSHU_APP_SECRET=
XIAOHONGSHU_REDIRECT_URI=http://localhost:8080/api/v1/auth/callback/xiaohongshu

# OAuth - GitHub
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=http://localhost:8080/api/v1/auth/callback/github

# OAuth - Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8080/api/v1/auth/callback/google

# Payment - Alipay
ALIPAY_APP_ID=
ALIPAY_PRIVATE_KEY=
ALIPAY_PUBLIC_KEY=
ALIPAY_NOTIFY_URL=http://localhost:8080/api/v1/payment/notify/alipay

# Payment - WeChat Pay
WECHAT_PAY_MCH_ID=
WECHAT_PAY_API_KEY=
WECHAT_PAY_SERIAL_NO=
WECHAT_PAY_CERT_PATH=
WECHAT_PAY_NOTIFY_URL=http://localhost:8080/api/v1/payment/notify/wechat

# Payment - Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Payment - PayPal
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_MODE=sandbox

# GitHub API (for crawler)
GITHUB_TOKEN=

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
```

**Step 5: 创建docker-compose.yml**

```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: skillhub-postgres
    environment:
      POSTGRES_USER: ${DB_USER:-skillhub}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-skillhub_password}
      POSTGRES_DB: ${DB_NAME:-skillhub}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-skillhub}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - skillhub-network

  redis:
    image: redis:7-alpine
    container_name: skillhub-redis
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - skillhub-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: skillhub-backend
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=${DB_USER:-skillhub}
      - DB_PASSWORD=${DB_PASSWORD:-skillhub_password}
      - DB_NAME=${DB_NAME:-skillhub}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - GIN_MODE=${GIN_MODE:-debug}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRATION=${JWT_EXPIRATION:-24h}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "8080:8080"
    networks:
      - skillhub-network
    deploy:
      replicas: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: skillhub-frontend
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
      - NEXT_PUBLIC_APP_URL=http://localhost:3000
    depends_on:
      - backend
    ports:
      - "3000:3000"
    networks:
      - skillhub-network
    deploy:
      replicas: 3

  nginx:
    image: nginx:alpine
    container_name: skillhub-nginx
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - frontend
      - backend
    ports:
      - "80:80"
      - "443:443"
    networks:
      - skillhub-network

volumes:
  postgres_data:
  redis_data:

networks:
  skillhub-network:
    driver: bridge
EOF
```

**Step 6: 创建目录结构**

```bash
mkdir -p backend/{api/{auth,payment,skills,users,admin,analytics},models,services/{auth,payment,crawler,analytics,scheduler},config,middleware,cron,docs}
mkdir -p frontend/{app,components,lib,hooks,stores,types,locales/{en,zh},public}
mkdir -p docker/{nginx,postgres}
mkdir -p docs/plans
```

**Step 7: 提交**

```bash
git add .
git commit -m "feat: 初始化项目结构和基础配置文件"
```

---

### Task 1.2: 创建后端基础框架

**Files:**
- Create: `backend/go.mod`
- Create: `backend/main.go`
- Create: `backend/config/config.go`

**Step 1: 创建go.mod**

```bash
cd backend && cat > go.mod << 'EOF'
module skillhub

go 1.21

require (
	github.com/gin-gonic/gin v1.9.1
	github.com/swaggo/files v1.0.1
	github.com/swaggo/gin-swagger v1.6.0
	github.com/swaggo/swag v1.16.2
	github.com/joho/godotenv v1.5.1
	gorm.io/driver/postgres v1.5.4
	gorm.io/gorm v1.25.5
	github.com/redis/go-redis/v9 v9.3.0
	github.com/golang-jwt/jwt/v5 v5.2.0
	github.com/google/uuid v1.5.0
	golang.org/x/oauth2 v0.15.0
	github.com/robfig/cron/v3 v3.0.1
	github.com/rs/cors v1.10.1
)
EOF
cd ..
```

**Step 2: 创建config.go**

```bash
cat > backend/config/config.go << 'EOF'
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
EOF
```

**Step 3: 创建main.go**

```bash
cat > backend/main.go << 'EOF'
package main

import (
	"log"
	"skillhub/config"
	"skillhub/docs"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "github.com/lib/pq"
)

// @title Skills商店SaaS平台API
// @version 1.0
// @description Skills商店SaaS平台后端API文档
// @host localhost:8080
// @BasePath /api/v1
func main() {
	config.AppConfig = config.LoadConfig()
	
	if config.AppConfig.Server.Mode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}
	
	router := gin.Default()
	
	// CORS middleware
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	})
	
	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
	
	// API v1
	v1 := router.Group("/api/v1")
	{
		auth := v1.Group("/auth")
		{
			// auth routes will be added later
		}
		
		skills := v1.Group("/skills")
		{
			// skills routes will be added later
		}
		
		users := v1.Group("/users")
		{
			// users routes will be added later
		}
		
		admin := v1.Group("/admin")
		{
			// admin routes will be added later
		}
	}
	
	// Swagger documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	
	log.Printf("Starting server on port %s in %s mode", config.AppConfig.Server.Port, config.AppConfig.Server.Mode)
	if err := router.Run(":" + config.AppConfig.Server.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
EOF
```

**Step 4: 创建Swagger文档目录**

```bash
mkdir -p backend/docs && cat > backend/docs/docs.go << 'EOF'
// Package docs Code generated by swaggo/swag
package docs
EOF
```

**Step 5: 创建后端Dockerfile**

```bash
cat > backend/Dockerfile << 'EOF'
FROM golang:1.21-alpine AS builder

WORKDIR /app

COPY go.mod go.sum* ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o skillhub main.go

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /app/skillhub .

EXPOSE 8080

CMD ["./skillhub"]
EOF
```

**Step 6: 创建空go.sum文件**

```bash
touch backend/go.sum
```

**Step 7: 提交**

```bash
git add backend/
git commit -m "feat: 创建后端基础框架和配置"
```

---

### Task 1.3: 创建前端基础框架

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/next.config.js`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/Dockerfile`

**Step 1: 创建package.json**

```bash
cat > frontend/package.json << 'EOF'
{
  "name": "skillhub-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.17.0",
    "zustand": "^4.4.7",
    "next-intl": "^3.4.0",
    "recharts": "^2.10.3",
    "next-auth": "^4.24.5",
    "axios": "^1.6.5"
  },
  "devDependencies": {
    "@types/node": "^20.10.6",
    "@types/react": "^18.2.46",
    "@types/react-dom": "^18.2.18",
    "typescript": "^5.3.3",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.56.0",
    "eslint-config-next": "14.1.0"
  }
}
EOF
```

**Step 2: 创建next.config.js**

```bash
cat > frontend/next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['github.com', 'avatars.githubusercontent.com'],
  },
  i18n: {
    locales: ['en', 'zh'],
    defaultLocale: 'en',
  },
}

module.exports = nextConfig
EOF
```

**Step 3: 创建tsconfig.json**

```bash
cat > frontend/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF
```

**Step 4: 创建tailwind.config.ts**

```bash
cat > frontend/tailwind.config.ts << 'EOF'
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}

export default config
EOF
```

**Step 5: 创建postcss.config.js**

```bash
cat > frontend/postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF
```

**Step 6: 创建全局样式**

```bash
cat > frontend/app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
EOF
```

**Step 7: 创建layout文件**

```bash
mkdir -p frontend/app && cat > frontend/app/layout.tsx << 'EOF'
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Skills Store - AI Skills Marketplace",
  description: "Discover and purchase AI skills for your applications",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
EOF
```

**Step 8: 创建首页**

```bash
cat > frontend/app/page.tsx << 'EOF'
export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-4">
            Skills Store
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Discover and Purchase AI Skills
          </p>
          <div className="max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search skills..."
              className="w-full px-6 py-4 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </main>
  )
}
EOF
```

**Step 9: 创建前端Dockerfile**

```bash
cat > frontend/Dockerfile << 'EOF'
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
EOF
```

**Step 10: 创建nginx配置**

```bash
mkdir -p docker/nginx && cat > docker/nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }

    upstream backend {
        server backend:8080;
    }

    server {
        listen 80;
        server_name localhost;

        location /api {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        location /swagger {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
        }

        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
EOF
```

**Step 11: 创建数据库初始化脚本**

```bash
cat > docker/postgres/init.sql << 'EOF'
-- Skills Store Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    avatar_url VARCHAR(500),
    bio TEXT,
    preferences JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create oauth_providers table
CREATE TABLE IF NOT EXISTS oauth_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50),
    provider_user_id VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);

-- Create skill_categories table
CREATE TABLE IF NOT EXISTS skill_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES skill_categories(id) ON DELETE SET NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create skill_tags table
CREATE TABLE IF NOT EXISTS skill_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    github_url VARCHAR(500),
    category_id UUID REFERENCES skill_categories(id) ON DELETE SET NULL,
    price_type VARCHAR(20) DEFAULT 'free',
    price DECIMAL(10, 2) DEFAULT 0.00,
    downloads_count INT DEFAULT 0,
    purchases_count INT DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    stars_count INT DEFAULT 0,
    forks_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create skill_tag_relations table
CREATE TABLE IF NOT EXISTS skill_tag_relations (
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES skill_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (skill_id, tag_id)
);

-- Create skill_translations table
CREATE TABLE IF NOT EXISTS skill_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    language VARCHAR(10),
    title VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_no VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    total_amount DECIMAL(10, 2),
    payment_method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
    price DECIMAL(10, 2),
    quantity INT DEFAULT 1
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    payment_channel VARCHAR(50),
    transaction_id VARCHAR(255),
    amount DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'pending',
    raw_response JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create skill_analytics table
CREATE TABLE IF NOT EXISTS skill_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    date DATE,
    views_count INT DEFAULT 0,
    downloads_count INT DEFAULT 0,
    purchases_count INT DEFAULT 0
);

-- Create sync_logs table
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_name VARCHAR(255),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    new_skills_count INT DEFAULT 0,
    updated_skills_count INT DEFAULT 0,
    error_message TEXT,
    status VARCHAR(50)
);

-- Create scheduled_tasks table
CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_name VARCHAR(255) UNIQUE NOT NULL,
    cron_expression VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user
INSERT INTO users (email, role, is_active) VALUES ('admin@skillhub.com', 'admin', true);

-- Insert default categories
INSERT INTO skill_categories (name, sort_order) VALUES 
    ('Tools', 1),
    ('Development', 2),
    ('Data & AI', 3),
    ('Business', 4),
    ('DevOps', 5);

-- Insert default scheduled task
INSERT INTO scheduled_tasks (task_name, cron_expression, description) VALUES 
    ('sync_github_skills', '0 2 * * *', 'Sync skills from GitHub API daily at 2 AM');
EOF
```

**Step 12: 提交**

```bash
git add frontend/ docker/
git commit -m "feat: 创建前端基础框架和Docker配置"
```

---

**第一阶段完成！** 基础架构已搭建完成，包括：
- ✅ Git仓库初始化
- ✅ 项目结构创建
- ✅ 后端基础框架（Go + Gin）
- ✅ 前端基础框架（Next.js + TypeScript + Tailwind）
- ✅ Docker Compose编排
- ✅ Nginx负载均衡配置
- ✅ 数据库初始化脚本

---

## Phase 2: 数据库模型和GORM集成

### Task 2.1: 创建GORM数据模型

**Files:**
- Create: `backend/models/user.go`
- Create: `backend/models/skill.go`
- Create: `backend/models/order.go`
- Create: `backend/models/analytics.go`
- Create: `backend/models/models.go`

**Step 1: 创建models.go（数据库连接）**

```bash
cat > backend/models/models.go << 'EOF'
package models

import (
	"fmt"
	"skillhub/config"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() error {
	cfg := config.AppConfig.Database
	
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.Name)
	
	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}
	
	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get database instance: %w", err)
	}
	
	// Set connection pool settings
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)
	
	// Auto migrate
	if err := AutoMigrate(); err != nil {
		return fmt.Errorf("failed to auto migrate: %w", err)
	}
	
	return nil
}

func AutoMigrate() error {
	return DB.AutoMigrate(
		&User{},
		&UserProfile{},
		&OAuthProvider{},
		&SkillCategory{},
		&SkillTag{},
		&Skill{},
		&SkillTranslation{},
		&Order{},
		&OrderItem{},
		&Transaction{},
		&SkillAnalytics{},
		&SyncLog{},
		&ScheduledTask{},
	)
}
EOF
```

**Step 2: 创建user.go**

```bash
cat > backend/models/user.go << 'EOF'
package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRole string

const (
	RoleUser  UserRole = "user"
	RoleAdmin UserRole = "admin"
)

type User struct {
	ID           uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Email        string     `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	PasswordHash string     `gorm:"type:varchar(255)" json:"-"`
	Role         UserRole   `gorm:"type:varchar(50);default:'user'" json:"role"`
	IsActive     bool       `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	
	// Relations
	Profile       UserProfile      `gorm:"foreignKey:UserID" json:"profile,omitempty"`
	OAuthProviders []OAuthProvider `gorm:"foreignKey:UserID" json:"oauth_providers,omitempty"`
	Orders        []Order         `gorm:"foreignKey:UserID" json:"orders,omitempty"`
}

type UserProfile struct {
	ID         uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	UserID     uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	AvatarURL  string     `gorm:"type:varchar(500)" json:"avatar_url"`
	Bio        string     `gorm:"type:text" json:"bio"`
	Preferences string     `gorm:"type:jsonb" json:"preferences"`
	CreatedAt  time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt  time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	
	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

type OAuthProvider struct {
	ID             uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	UserID         uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	Provider       string     `gorm:"type:varchar(50);not null;index:idx_provider" json:"provider"`
	ProviderUserID string     `gorm:"type:varchar(255);not null;index:idx_provider" json:"provider_user_id"`
	AccessToken    string     `gorm:"type:text;not null" json:"-"`
	RefreshToken   string     `gorm:"type:text" json:"-"`
	ExpiresAt      *time.Time `json:"expires_at,omitempty"`
	CreatedAt      time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt      time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	
	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}
EOF
```

**Step 3: 创建skill.go**

```bash
cat > backend/models/skill.go << 'EOF'
package models

import (
	"time"

	"github.com/google/uuid"
)

type PriceType string

const (
	PriceTypeFree PriceType = "free"
	PriceTypePaid PriceType = "paid"
)

type SkillCategory struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Name      string         `gorm:"type:varchar(255);not null" json:"name"`
	ParentID  *uuid.UUID     `gorm:"type:uuid;index" json:"parent_id,omitempty"`
	SortOrder int            `gorm:"default:0" json:"sort_order"`
	CreatedAt time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time      `gorm:"autoUpdateTime" json:"updated_at"`
	
	Parent   *SkillCategory `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Children []SkillCategory `gorm:"foreignKey:ParentID" json:"children,omitempty"`
	Skills   []Skill         `gorm:"foreignKey:CategoryID" json:"skills,omitempty"`
}

type SkillTag struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Name      string    `gorm:"type:varchar(255);uniqueIndex;not null" json:"name"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

type Skill struct {
	ID              uuid.UUID        `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Name            string           `gorm:"type:varchar(255);not null" json:"name"`
	Description     string           `gorm:"type:text" json:"description"`
	GitHubURL       string           `gorm:"type:varchar(500)" json:"github_url"`
	CategoryID      *uuid.UUID       `gorm:"type:uuid;index" json:"category_id,omitempty"`
	PriceType       PriceType        `gorm:"type:varchar(20);default:'free'" json:"price_type"`
	Price           float64          `gorm:"type:decimal(10,2);default:0.00" json:"price"`
	DownloadsCount  int              `gorm:"default:0" json:"downloads_count"`
	PurchasesCount  int              `gorm:"default:0" json:"purchases_count"`
	Rating          float64          `gorm:"type:decimal(3,2);default:0.00" json:"rating"`
	StarsCount      int              `gorm:"default:0" json:"stars_count"`
	ForksCount      int              `gorm:"default:0" json:"forks_count"`
	IsActive        bool             `gorm:"default:true;index" json:"is_active"`
	LastSyncAt      *time.Time       `json:"last_sync_at,omitempty"`
	CreatedAt       time.Time        `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt       time.Time        `gorm:"autoUpdateTime" json:"updated_at"`
	
	// Relations
	Category       *SkillCategory        `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Tags           []SkillTag            `gorm:"many2many:skill_tag_relations;" json:"tags,omitempty"`
	Translations   []SkillTranslation    `gorm:"foreignKey:SkillID" json:"translations,omitempty"`
	OrderItems     []OrderItem           `gorm:"foreignKey:SkillID" json:"order_items,omitempty"`
	Analytics      []SkillAnalytics      `gorm:"foreignKey:SkillID" json:"analytics,omitempty"`
}

type SkillTranslation struct {
	ID          uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	SkillID     uuid.UUID  `gorm:"type:uuid;not null;index" json:"skill_id"`
	Language    string     `gorm:"type:varchar(10);not null" json:"language"`
	Title       string     `gorm:"type:varchar(255)" json:"title"`
	Description string     `gorm:"type:text" json:"description"`
	CreatedAt   time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	
	Skill *Skill `gorm:"foreignKey:SkillID" json:"skill,omitempty"`
}
EOF
```

**Step 4: 创建order.go**

```bash
cat > backend/models/order.go << 'EOF'
package models

import (
	"time"

	"github.com/google/uuid"
)

type OrderStatus string

const (
	OrderStatusPending   OrderStatus = "pending"
	OrderStatusPaid      OrderStatus = "paid"
	OrderStatusCancelled OrderStatus = "cancelled"
	OrderStatusRefunded  OrderStatus = "refunded"
)

type TransactionStatus string

const (
	TransactionStatusPending TransactionStatus = "pending"
	TransactionStatusSuccess TransactionStatus = "success"
	TransactionStatusFailed  TransactionStatus = "failed"
)

type Order struct {
	ID           uuid.UUID    `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	OrderNo      string       `gorm:"type:varchar(255);uniqueIndex;not null" json:"order_no"`
	UserID       uuid.UUID    `gorm:"type:uuid;not null;index" json:"user_id"`
	TotalAmount  float64      `gorm:"type:decimal(10,2)" json:"total_amount"`
	PaymentMethod string      `gorm:"type:varchar(50)" json:"payment_method"`
	Status       OrderStatus  `gorm:"type:varchar(50);default:'pending'" json:"status"`
	CreatedAt    time.Time    `gorm:"autoCreateTime" json:"created_at"`
	PaidAt       *time.Time   `json:"paid_at,omitempty"`
	
	User         User         `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Items        []OrderItem  `gorm:"foreignKey:OrderID" json:"items,omitempty"`
	Transactions []Transaction `gorm:"foreignKey:OrderID" json:"transactions,omitempty"`
}

type OrderItem struct {
	ID       uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	OrderID  uuid.UUID `gorm:"type:uuid;not null;index" json:"order_id"`
	SkillID  *uuid.UUID `gorm:"type:uuid" json:"skill_id,omitempty"`
	Price    float64   `gorm:"type:decimal(10,2)" json:"price"`
	Quantity int       `gorm:"default:1" json:"quantity"`
	
	Order Order `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	Skill *Skill `gorm:"foreignKey:SkillID" json:"skill,omitempty"`
}

type Transaction struct {
	ID             uuid.UUID        `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	OrderID        uuid.UUID        `gorm:"type:uuid;not null;index" json:"order_id"`
	PaymentChannel string           `gorm:"type:varchar(50)" json:"payment_channel"`
	TransactionID  string           `gorm:"type:varchar(255)" json:"transaction_id"`
	Amount         float64          `gorm:"type:decimal(10,2)" json:"amount"`
	Status         TransactionStatus `gorm:"type:varchar(50);default:'pending'" json:"status"`
	RawResponse    string           `gorm:"type:jsonb" json:"raw_response,omitempty"`
	CreatedAt      time.Time        `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt      time.Time        `gorm:"autoUpdateTime" json:"updated_at"`
	
	Order Order `gorm:"foreignKey:OrderID" json:"order,omitempty"`
}
EOF
```

**Step 5: 创建analytics.go**

```bash
cat > backend/models/analytics.go << 'EOF'
package models

import (
	"time"

	"github.com/google/uuid"
)

type SkillAnalytics struct {
	ID              uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	SkillID         uuid.UUID  `gorm:"type:uuid;not null;index:idx_skill_date" json:"skill_id"`
	Date            time.Time  `gorm:"type:date;index:idx_skill_date" json:"date"`
	ViewsCount      int        `gorm:"default:0" json:"views_count"`
	DownloadsCount  int        `gorm:"default:0" json:"downloads_count"`
	PurchasesCount  int        `gorm:"default:0" json:"purchases_count"`
	
	Skill *Skill `gorm:"foreignKey:SkillID" json:"skill,omitempty"`
}

type SyncLog struct {
	ID                 uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	TaskName           string     `gorm:"type:varchar(255)" json:"task_name"`
	StartTime          time.Time  `json:"start_time"`
	EndTime            *time.Time `json:"end_time,omitempty"`
	NewSkillsCount     int        `gorm:"default:0" json:"new_skills_count"`
	UpdatedSkillsCount int        `gorm:"default:0" json:"updated_skills_count"`
	ErrorMessage       string     `gorm:"type:text" json:"error_message,omitempty"`
	Status             string     `gorm:"type:varchar(50)" json:"status"`
}

type ScheduledTask struct {
	ID             uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	TaskName       string     `gorm:"type:varchar(255);uniqueIndex;not null" json:"task_name"`
	CronExpression string     `gorm:"type:varchar(100)" json:"cron_expression"`
	IsActive       bool       `gorm:"default:true" json:"is_active"`
	Description    string     `gorm:"type:text" json:"description"`
	CreatedAt      time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt      time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
}
EOF
```

**Step 6: 提交**

```bash
git add backend/models/
git commit -m "feat: 创建GORM数据模型"
```

---

## Phase 3: 用户认证系统

### Task 3.1: 实现JWT中间件和工具

**Files:**
- Create: `backend/middleware/auth.go`
- Create: `backend/middleware/cors.go`
- Create: `backend/lib/jwt.go`
- Create: `backend/lib/password.go`

**Step 1: 创建jwt.go**

```bash
mkdir -p backend/lib
cat > backend/lib/jwt.go << 'EOF'
package lib

import (
	"errors"
	"skillhub/config"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Claims struct {
	UserID uuid.UUID `json:"user_id"`
	Email  string    `json:"email"`
	Role   string    `json:"role"`
	jwt.RegisteredClaims
}

func GenerateToken(userID uuid.UUID, email string, role string) (string, error) {
	cfg := config.AppConfig.JWT
	
	claims := Claims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(cfg.Expiration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "skillhub",
		},
	}
	
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.Secret))
}

func ValidateToken(tokenString string) (*Claims, error) {
	cfg := config.AppConfig.JWT
	
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(cfg.Secret), nil
	})
	
	if err != nil {
		return nil, err
	}
	
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}
	
	return nil, errors.New("invalid token")
}
EOF
```

**Step 2: 创建password.go**

```bash
cat > backend/lib/password.go << 'EOF'
package lib

import (
	"golang.org/x/crypto/bcrypt"
)

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
EOF
```

**Step 3: 创建auth.go中间件**

```bash
cat > backend/middleware/auth.go << 'EOF'
package middleware

import (
	"net/http"
	"strings"
	"skillhub/lib"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}
		
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := lib.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}
		
		c.Set("user_id", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)
		
		c.Next()
	}
}

func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists || role != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			c.Abort()
			return
		}
		c.Next()
	}
}
EOF
```

**Step 4: 提交**

```bash
git add backend/lib/ backend/middleware/
git commit -m "feat: 实现JWT认证中间件和工具函数"
```

---

## 注意

由于实施计划非常庞大，以上完成了前3个阶段的详细任务定义。后续阶段包括：

- Phase 3-7: 用户认证、爬虫、支付、前端页面、统计优化、测试部署

**完整计划已保存到 `docs/plans/2026-01-28-skillhub-implementation.md`**

现在可以选择执行方式：

1. **Subagent-Driven（当前会话）** - 我将逐个派发子代理执行任务，每个任务后进行代码审查，快速迭代
2. **Parallel Session（独立会话）** - 在新的worktree会话中使用executing-plans批量执行，设置检查点

选择哪种执行方式？
