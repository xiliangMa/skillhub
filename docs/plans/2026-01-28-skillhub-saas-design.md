# Skills商店SaaS平台 - 整体设计方案

**设计日期**: 2026-01-28
**设计目标**: 实现专业SaaS版Skills商店

---

## 一、系统整体架构

系统采用前后端分离的微服务架构，主要分为以下几个层级：

**前端层（Next.js 14）**：
- 使用App Router架构，实现服务端渲染和客户端交互
- 集成next-intl实现多语言国际化，语言配置存储在JSON文件中
- 使用Tailwind CSS + shadcn/ui构建现代化UI，参考LobeHub的深色科技风格
- 响应式设计，自动适配桌面端和移动端

**后端层（Go + Gin）**：
- Gin框架构建RESTful API，提供高性能的HTTP服务
- 集成swaggo自动生成Swagger API文档
- 实现OAuth 2.0统一认证（微信、飞书、小红书、GitHub、Google）
- 多渠道支付集成：
  - 国内：支付宝、微信支付
  - 国际：信用卡（Stripe）、银行卡（PayPal）
  - 统一支付接口，支持动态切换支付渠道

**数据层**：
- PostgreSQL作为主数据库，存储用户、订单、技能等核心数据
- Redis缓存热门技能、统计数据，提升查询性能
- 定时任务使用robfig/cron，支持配置化的Cron表达式，可在后台管理界面动态调整执行时间

---

## 二、数据库设计

### 2.1 用户相关表

**users**：用户基本信息
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR, NULLABLE)
- role (ENUM: user, admin)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

**user_profiles**：用户扩展信息
- id (UUID, PK)
- user_id (UUID, FK)
- avatar_url (VARCHAR)
- bio (TEXT)
- preferences (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

**oauth_providers**：第三方登录绑定记录
- id (UUID, PK)
- user_id (UUID, FK)
- provider (VARCHAR) - wechat, feishu, xiaohongshu, github, google
- provider_user_id (VARCHAR)
- access_token (TEXT, ENCRYPTED)
- refresh_token (TEXT, ENCRYPTED, NULLABLE)
- expires_at (TIMESTAMP, NULLABLE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### 2.2 技能相关表

**skills**：技能主表
- id (UUID, PK)
- name (VARCHAR)
- description (TEXT)
- github_url (VARCHAR)
- category_id (UUID, FK)
- price_type (ENUM: free, paid)
- price (DECIMAL(10,2))
- downloads_count (INT, DEFAULT 0)
- purchases_count (INT, DEFAULT 0)
- rating (DECIMAL(3,2), DEFAULT 0.00)
- stars_count (INT, DEFAULT 0)
- forks_count (INT, DEFAULT 0)
- is_active (BOOLEAN, DEFAULT true)
- last_sync_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

**skill_categories**：技能分类
- id (UUID, PK)
- name (VARCHAR)
- parent_id (UUID, FK, NULLABLE)
- sort_order (INT, DEFAULT 0)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

**skill_tags**：技能标签
- id (UUID, PK)
- name (VARCHAR, UNIQUE)
- created_at (TIMESTAMP)

**skill_tag_relations**：技能标签关联
- skill_id (UUID, FK)
- tag_id (UUID, FK)

**skill_translations**：技能多语言信息
- id (UUID, PK)
- skill_id (UUID, FK)
- language (VARCHAR)
- title (VARCHAR)
- description (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### 2.3 交易相关表

**orders**：订单主表
- id (UUID, PK)
- order_no (VARCHAR, UNIQUE)
- user_id (UUID, FK)
- total_amount (DECIMAL(10,2))
- payment_method (VARCHAR) - alipay, wechat, stripe, paypal
- status (ENUM: pending, paid, cancelled, refunded)
- created_at (TIMESTAMP)
- paid_at (TIMESTAMP, NULLABLE)

**order_items**：订单明细
- id (UUID, PK)
- order_id (UUID, FK)
- skill_id (UUID, FK)
- price (DECIMAL(10,2))
- quantity (INT, DEFAULT 1)

**transactions**：支付流水
- id (UUID, PK)
- order_id (UUID, FK)
- payment_channel (VARCHAR)
- transaction_id (VARCHAR)
- amount (DECIMAL(10,2))
- status (ENUM: pending, success, failed)
- raw_response (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### 2.4 统计相关表

**skill_analytics**：技能统计数据
- id (UUID, PK)
- skill_id (UUID, FK)
- date (DATE)
- views_count (INT, DEFAULT 0)
- downloads_count (INT, DEFAULT 0)
- purchases_count (INT, DEFAULT 0)

**sync_logs**：爬取同步日志
- id (UUID, PK)
- task_name (VARCHAR)
- start_time (TIMESTAMP)
- end_time (TIMESTAMP)
- new_skills_count (INT, DEFAULT 0)
- updated_skills_count (INT, DEFAULT 0)
- error_message (TEXT, NULLABLE)
- status (ENUM: success, failed, partial)

### 2.5 系统配置表

**scheduled_tasks**：定时任务配置
- id (UUID, PK)
- task_name (VARCHAR, UNIQUE)
- cron_expression (VARCHAR)
- is_active (BOOLEAN, DEFAULT true)
- description (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

---

## 三、后端核心模块设计

### 3.1 爬虫模块（crawler）
- GitHub API集成，解析SKILL.md格式
- SkillsMP网站数据爬取备用方案
- 支持增量同步和全量同步
- 数据清洗和标准化处理

### 3.2 支付模块（payment）
- 支付宝SDK集成（扫码支付、H5支付）
- 微信支付SDK集成（JSAPI、扫码、H5）
- Stripe集成（信用卡支付）
- PayPal集成（银行卡支付）
- 统一支付接口抽象，支持渠道动态切换
- 支付回调处理和订单状态更新

### 3.3 认证模块（auth）
- OAuth 2.0统一认证实现
- JWT token生成和验证
- 多provider登录支持（微信、飞书、小红书、GitHub、Google）
- 用户信息合并逻辑

### 3.4 统计模块（analytics）
- 实时统计（浏览量、下载量、购买量）
- 定时聚合任务（日/周/月统计）
- Redis缓存热门数据
- 多维度数据查询接口

### 3.5 定时任务模块（scheduler）
- cron表达式解析和执行
- 任务配置存储在数据库，支持动态调整
- 任务执行日志记录
- 失败重试机制

---

## 四、前端核心页面设计

### 4.1 首页（/）
- 顶部导航栏（logo、搜索框、语言切换、登录/用户中心）
- Hero区域（动态标语、搜索框、分类快捷入口）
- 热门Skills展示（按下载量/购买量/评分排序）
- 趋势分析板块（展示近期热门）
- 分类浏览区（文件夹风格，类似SkillsMP的CLI设计）
- 页脚（版权、社交链接、FAQ入口）

### 4.2 技能详情页（/skills/[id]）
- 技能基本信息（名称、描述、GitHub链接、Stars/Forks数）
- 价格和购买按钮（免费/付费区分）
- 多语言描述切换
- 使用安装说明
- 评价和评论区域
- 相关技能推荐

### 4.3 搜索页（/search）
- 搜索框（支持关键词和AI语义搜索）
- 高级筛选（分类、价格类型、排序方式）
- 搜索结果列表（卡片式展示）
- 分页加载

### 4.4 用户中心（/dashboard）
- 我的订单（购买记录、订单状态）
- 我的技能（已购买的技能）
- 个人信息编辑
- 绑定的第三方账号管理

### 4.5 管理后台（/admin）
- Skills管理（列表、编辑、上下架、手动编辑）
- 用户管理（用户列表、权限管理）
- 订单管理（订单列表、状态查询）
- 统计分析（数据图表、导出）
- 定时任务配置（Cron表达式调整、执行日志）
- 系统设置（支付配置、OAuth配置）

---

## 五、部署架构

使用Docker Compose + Nginx负载均衡实现单机多副本部署：

### 5.1 容器服务划分
- `frontend`：Next.js前端应用（3个副本）
- `backend`：Go后端API服务（3个副本）
- `postgres`：PostgreSQL数据库（1个副本，数据持久化）
- `redis`：Redis缓存服务（1个副本）
- `nginx`：Nginx反向代理和负载均衡（1个副本）

### 5.2 网络架构
- 使用Docker Bridge网络连接各服务
- Nginx作为统一入口，反向代理到frontend和backend
- 后端服务间通过内部DNS通信
- 前端通过API网关与后端通信

### 5.3 负载均衡策略
- Nginx使用轮询策略分发请求到多个副本
- 健康检查：每个服务提供/health端点
- 自动重启：容器异常退出时自动重启

### 5.4 数据持久化
- PostgreSQL数据卷挂载到宿主机
- Redis开启AOF持久化
- 日志文件持久化到宿主机

### 5.5 扩展性
- 可通过修改docker-compose.yml中的replicas数量调整副本数
- 支持水平扩展，未来可迁移到Kubernetes

### 5.6 部署配置文件
- Dockerfile（frontend和backend）
- docker-compose.yml（服务编排）
- nginx.conf（负载均衡配置）
- .env（环境变量配置）

---

## 六、技术实现细节

### 6.1 前端技术栈
- Next.js 14（App Router + Server Actions）
- TypeScript 5（强类型支持）
- Tailwind CSS 3（样式系统）
- shadcn/ui（组件库，可定制）
- next-intl（国际化）
- React Query（数据获取和缓存）
- Zustand（状态管理）
- Recharts（数据可视化图表）
- next-auth（前端OAuth认证集成）

### 6.2 后端技术栈
- Go 1.21+（高性能编译型语言）
- Gin框架（Web框架）
- GORM 2（ORM框架）
- PostgreSQL 15+（主数据库）
- Redis 7（缓存）
- JWT-go（认证token）
- golang.org/x/oauth2（OAuth 2.0客户端支持）
- 第三方OAuth SDK：
  - 微信开放平台SDK
  - 飞书开放平台SDK
  - 小红书开放平台SDK
  - GitHub OAuth客户端
  - Google OAuth 2.0客户端
- robfig/cron（定时任务）
- swaggo/swag（Swagger文档生成）
- 支付宝SDK + 微信支付SDK
- Stripe SDK + PayPal SDK

### 6.3 爬虫技术栈
- go-github（GitHub API客户端）
- colly（网页爬取框架）
- goquery（HTML解析）
- SKILL.md格式解析器
- 增量同步逻辑（基于last_sync_at字段）

### 6.4 DevOps工具
- Docker + Docker Compose
- Nginx（负载均衡）
- Makefile（构建脚本）
- GitHub Actions（CI/CD，可选）

---

## 七、项目结构

```
skillhub/
├── backend/                 # Go后端服务
│   ├── api/                # API路由和处理器
│   ├── models/             # 数据模型
│   ├── services/           # 业务逻辑层
│   │   ├── auth/          # 认证服务
│   │   ├── payment/       # 支付服务
│   │   ├── crawler/       # 爬虫服务
│   │   ├── analytics/     # 统计服务
│   │   └── scheduler/     # 定时任务
│   ├── config/            # 配置文件
│   ├── middleware/        # 中间件
│   ├── docs/              # Swagger文档
│   ├── cron/              # 定时任务入口
│   └── main.go           # 主入口
│
├── frontend/              # Next.js前端应用
│   ├── app/              # App Router页面
│   ├── components/       # 组件
│   ├── lib/             # 工具函数
│   ├── hooks/           # 自定义Hooks
│   ├── stores/          # 状态管理
│   ├── types/           # TypeScript类型
│   ├── locales/         # 多语言文件
│   └── public/          # 静态资源
│
├── docker/              # Docker配置
│   ├── nginx/          # Nginx配置
│   └── postgres/       # PostgreSQL初始化脚本
│
├── docs/               # 文档
│   └── plans/         # 设计文档
│
├── docker-compose.yml  # 容器编排
├── Makefile          # 构建脚本
└── README.md         # 项目说明
```

---

## 八、开发阶段规划

### Phase 1: 基础架构搭建
1. 初始化前后端项目
2. 配置数据库和Redis
3. 设置Docker Compose环境
4. 实现基础API框架

### Phase 2: 用户认证系统
1. 实现OAuth 2.0登录
2. JWT认证中间件
3. 用户管理CRUD

### Phase 3: 爬虫和数据同步
1. GitHub API集成
2. SKILL.md解析
3. 数据同步逻辑
4. 定时任务配置

### Phase 4: 支付系统集成
1. 支付宝/微信支付
2. Stripe/PayPal集成
3. 订单管理
4. 支付回调处理

### Phase 5: 前端核心页面
1. 首页和搜索页
2. 技能详情页
3. 用户中心
4. 管理后台

### Phase 6: 统计和优化
1. 数据统计模块
2. Redis缓存优化
3. 性能优化
4. 多语言完善

### Phase 7: 测试和部署
1. 单元测试
2. 集成测试
3. 压力测试
4. 生产环境部署

---

## 九、参考网站

- 功能参考：https://skillsmp.com/
- UI风格参考：https://lobehub.com/zh
