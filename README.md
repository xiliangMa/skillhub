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
