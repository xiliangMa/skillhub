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
- Docker Compose + Nginx负载均衡部署

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
- shadcn/ui组件库
- next-intl国际化

## 快速开始

### 前置要求
- Docker 24+
- Docker Compose 2+

### 一键启动

```bash
# 启动所有服务（包括数据库、Redis、后端、前端、Nginx）
./start.sh

# 或者使用Make
make dev
```

### 手动启动

```bash
# 1. 复制环境变量文件
cp .env.example .env

# 2. 启动Docker服务
docker-compose up -d

# 3. 查看服务状态
docker-compose ps

# 4. 查看日志
docker-compose logs -f
```

## 访问地址

- **前端页面**: http://localhost:3000
- **后端API**: http://localhost:8080
- **API文档**: http://localhost:8080/swagger/index.html
- **Nginx入口**: http://localhost

## 常用命令

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f

# 查看服务状态
docker-compose ps

# 重建并启动
docker-compose up -d --build
```

## 配置说明

环境变量配置在 `.env` 文件中，主要配置项：

- 数据库连接（DB_*）
- Redis连接（REDIS_*）
- JWT密钥（JWT_SECRET）
- OAuth配置（GITHUB_*, GOOGLE_*, WECHAT_*等）
- 支付配置（ALIPAY_*, STRIPE_*, PAYPAL_*等）

详细配置说明请参考 `.env.example` 文件。

## 开发指南

### 本地开发（不使用Docker）

```bash
# 启动基础服务
docker-compose up postgres redis -d

# 后端开发
cd backend
go mod tidy
go run main.go

# 前端开发
cd frontend
npm install
npm run dev
```

## 项目结构

```
skillhub/
├── backend/          # Go后端服务
│   ├── api/         # API路由
│   ├── models/      # 数据模型
│   ├── services/    # 业务逻辑
│   ├── config/      # 配置管理
│   └── main.go     # 程序入口
├── frontend/        # Next.js前端
│   ├── app/        # App Router页面
│   ├── components/ # React组件
│   ├── lib/        # 工具函数
│   └── public/     # 静态资源
├── docker/         # Docker配置
│   ├── nginx/     # Nginx配置
│   └── postgres/  # PostgreSQL初始化脚本
└── docs/          # 文档
```

## 许可证

MIT License
