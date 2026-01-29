# SkillHub 测试说明文档

## 项目概述
SkillHub是一个AI技能商店SaaS平台，支持技能浏览、购买和管理。

## 服务状态
- ✅ 后端服务运行中：http://localhost:8080
- ✅ 前端服务运行中：http://localhost:3001
- ✅ PostgreSQL数据库：localhost:5432
- ✅ Redis缓存：localhost:6379

## Mock数据说明

### 测试账号
| 邮箱 | 密码 | 角色 | 说明 |
|------|------|------|------|
| admin@skillhub.com | admin123 | 管理员 | 可访问管理后台 |
| user@example.com | admin123 | 普通用户 | 已有订单数据 |
| test@example.com | admin123 | 普通用户 | 已有订单数据 |

### 技能数据（12个）
- 免费技能（5个）：数据清洗大师、代码质量检测、SQL优化大师、日志分析工具、文本摘要生成器
- 付费技能（7个）：Claude代码分析助手、GPT4文档生成器、Excel自动报表、客服机器人、图像识别助手、工作流自动化、邮件自动回复

### 订单数据（4笔）
- 3笔已支付订单
- 1笔待支付订单
- 总收入：$695

### 分类数据（5个）
- AI助手
- 数据处理
- 自动化
- 开发工具
- 业务应用

## 已实现功能

### 后端API (Go + Gin)

#### 认证模块 (/api/v1/auth)
- ✅ POST /login - 用户登录
- ✅ POST /register - 用户注册
- ✅ GET /me - 获取当前用户信息
- ✅ GET /oauth/:provider - OAuth登录（GitHub、Google）
- ⚠️  GET /callback/github - GitHub回调（待实现）
- ⚠️  GET /callback/google - Google回调（待实现）

#### 技能模块 (/api/v1/skills)
- ✅ GET / - 获取技能列表（支持分页、搜索、分类筛选）
- ✅ GET /:id - 获取技能详情
- ✅ GET /categories - 获取分类列表
- ✅ GET /hot - 获取热门技能（按下载量排序）
- ✅ GET /trending - 获取趋势技能（按购买量排序）

#### 支付模块 (/api/v1/payment) - 需要认证
- ✅ POST /orders - 创建订单
- ✅ GET /orders - 获取订单列表
- ✅ POST /payment/orders/:id/pay - 获取支付链接
- ✅ POST /callback/alipay - 支付宝回调

#### 管理员模块 (/api/v1/admin) - 需要管理员认证
- ✅ GET /skills - 获取所有技能
- ✅ PUT /skills/:id - 更新技能信息
- ✅ GET /users - 获取用户列表
- ✅ GET /orders - 获取订单列表
- ✅ GET /analytics - 获取统计数据

### 前端页面 (Next.js 14 + TypeScript + Tailwind CSS)

#### 用户页面
- ✅ 首页 (/) - 热门技能、趋势技能展示
- ✅ 技能列表页 (/skills) - 技能浏览、搜索、分类筛选、分页
- ✅ 技能详情页 (/skills/:id) - 技能详情、购买功能
- ✅ 登录注册页 (/login) - 用户登录和注册

#### 管理后台
- ✅ 管理后台首页 (/admin) - 数据概览、最近订单
  - 总收入统计
  - 订单统计
  - 用户统计
  - 技能统计
  - 最近订单列表

#### 导航和布局
- ✅ 响应式导航栏
- ✅ 页脚
- ✅ 移动端菜单

#### UI组件
- ✅ Button - 按钮组件
- ✅ Card - 卡片组件
- ✅ Input - 输入框组件
- ✅ Badge - 徽章组件
- ✅ Table - 表格组件
- ✅ SkillCard - 技能卡片组件

## API测试

### 运行测试脚本
```bash
./test-api.sh
```

### 手动测试示例

#### 1. 登录获取Token
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@skillhub.com","password":"admin123"}'
```

#### 2. 获取热门技能
```bash
curl http://localhost:8080/api/v1/skills/hot
```

#### 3. 获取统计数据（需要认证）
```bash
TOKEN="your-token-here"
curl http://localhost:8080/api/v1/admin/analytics \
  -H "Authorization: Bearer $TOKEN"
```

## 访问地址

- 前端应用：http://localhost:3001
- 后端API：http://localhost:8080
- Swagger文档：http://localhost:8080/swagger/index.html
- 健康检查：http://localhost:8080/health

## 开发脚本

- 启动所有服务：`./run-dev.sh`
- 停止所有服务：`./stop-dev.sh`
- 只启动后端：`./run-backend-dev.sh`
- 只启动前端：`./run-frontend-dev.sh`
- 测试API：`./test-api.sh`

## 待完善功能

### 前端
- [ ] 用户中心页面
- [ ] 购买历史页面
- [ ] 支付页面集成
- [ ] 管理后台的技能、用户、订单管理页面

### 后端
- [ ] OAuth登录完整实现
- [ ] 支付接口完整对接
- [ ] 技能上传和编辑功能
- [ ] 用户权限细化

## 技术栈

### 后端
- Go 1.x
- Gin Web框架
- GORM ORM
- PostgreSQL数据库
- Redis缓存
- JWT认证
- Swagger文档

### 前端
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui组件库
- Axios HTTP客户端

### 基础设施
- Docker & Docker Compose
- Nginx反向代理（生产环境）

## 数据库结构

主要表：
- users - 用户表
- user_profiles - 用户档案
- skills - 技能表
- skill_categories - 技能分类
- skill_tags - 技能标签
- orders - 订单表
- order_items - 订单项
- transactions - 交易记录
- skill_analytics - 技能统计

## 注意事项

1. 首次启动需要等待数据库初始化
2. Mock数据已自动填充，无需手动创建
3. 所有敏感信息（密码）都使用bcrypt加密
4. 管理员API需要管理员角色的Token才能访问
5. 前端和后端均已配置CORS，支持跨域请求

## 故障排查

### 后端无法启动
```bash
# 检查端口占用
lsof -ti:8080 | xargs kill -9

# 查看日志
tail -f /tmp/backend.log
```

### 前端无法启动
```bash
# 检查端口占用
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# 查看日志
tail -f /tmp/frontend.log
```

### 数据库连接失败
```bash
# 检查容器状态
docker ps | grep postgres

# 查看数据库日志
docker logs skillhub-postgres
```
