# Skills商店SaaS平台 - 配置指南

## 第一步：GitHub爬虫配置

### 1. 配置GitHub Personal Token
1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 选择以下权限：
   - `public_repo` (访问公开仓库)
   - `read:org` (读取组织信息，可选)
4. 生成Token并复制

5. 编辑 `.env` 文件，设置：
```
GITHUB_TOKEN=your_github_personal_token_here
```

### 2. 验证爬虫服务
启动服务后，爬虫将：
- 每天自动同步GitHub技能数据
- 解析SKILL.md文件格式
- 更新技能分类和标签

## 第二步：支付系统配置

### 1. 支付宝支付配置
1. 注册支付宝开放平台：https://open.alipay.com
2. 创建应用，获取：
   - AppID
   - 应用私钥 (Private Key)
   - 支付宝公钥 (Public Key)

3. 编辑 `.env` 文件，设置：
```
ALIPAY_APP_ID=your_app_id
ALIPAY_PRIVATE_KEY=your_private_key
ALIPAY_PUBLIC_KEY=your_public_key
ALIPAY_NOTIFY_URL=http://your-domain.com/api/v1/payment/callback/alipay
```

### 2. 微信支付配置
1. 注册微信支付商户平台：https://pay.weixin.qq.com
2. 申请开通Native支付或JSAPI支付
3. 获取：
   - 商户号 (MchID)
   - API密钥 (API Key)
   - 商户证书序列号 (Serial No)
   - API证书 (Cert Path)

4. 编辑 `.env` 文件，设置：
```
WECHAT_PAY_MCH_ID=your_mch_id
WECHAT_PAY_API_KEY=your_api_key
WECHAT_PAY_SERIAL_NO=your_serial_no
WECHAT_PAY_CERT_PATH=/path/to/cert.pem
WECHAT_PAY_NOTIFY_URL=http://your-domain.com/api/v1/payment/callback/wechat
```

### 3. Stripe支付配置（国际支付）
1. 注册Stripe：https://stripe.com
2. 获取测试密钥：
   - Secret Key (sk_test_xxx)
   - Publishable Key (pk_test_xxx)
   - Webhook Secret (whsec_xxx)

3. 编辑 `.env` 文件，设置：
```
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### 4. PayPal支付配置
1. 注册PayPal开发者：https://developer.paypal.com
2. 创建沙盒应用，获取：
   - Client ID
   - Client Secret

3. 编辑 `.env` 文件，设置：
```
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_MODE=sandbox
```

## 第三步：OAuth登录配置

### 1. GitHub OAuth
1. 访问 https://github.com/settings/developers
2. 创建OAuth App，设置：
   - Homepage URL: http://localhost:3000
   - Authorization callback URL: http://localhost:8080/api/v1/auth/callback/github

3. 编辑 `.env` 文件，设置：
```
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
```

### 2. Google OAuth
1. 访问 https://console.cloud.google.com/apis/credentials
2. 创建OAuth 2.0 Client ID，设置：
   - Authorized redirect URIs: http://localhost:8080/api/v1/auth/callback/google

3. 编辑 `.env` 文件，设置：
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

### 3. 微信OAuth
1. 访问 https://open.weixin.qq.com
2. 创建网站应用，获取：
   - AppID
   - AppSecret

3. 编辑 `.env` 文件，设置：
```
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret
```

### 4. 飞书OAuth
1. 访问 https://open.feishu.cn/app
2. 创建应用，获取：
   - App ID
   - App Secret

3. 编辑 `.env` 文件，设置：
```
FEISHU_APP_ID=your_app_id
FEISHU_APP_SECRET=your_app_secret
```

## 第四步：环境验证

### 1. 启动所有服务
```bash
# 启动数据库和Redis
docker-compose up postgres redis -d

# 启动后端（开发模式）
cd backend
go run main.go

# 启动前端（开发模式）
cd frontend
npm install
npm run dev
```

### 2. 验证服务状态
- 前端：http://localhost:3000
- 后端API：http://localhost:8080
- API文档：http://localhost:8080/swagger/index.html
- 健康检查：http://localhost:8080/health

### 3. 测试核心功能
1. **用户注册登录**
   - 邮箱密码注册
   - GitHub/Google OAuth登录

2. **技能浏览**
   - 查看技能列表
   - 搜索和筛选技能

3. **购买流程**
   - 选择付费技能
   - 模拟支付流程
   - 下载验证

4. **管理后台**
   - 访问 http://localhost:3000/admin
   - 查看统计数据
   - 管理技能和用户

## 第五步：生产部署准备

### 1. 安全配置
1. 生成强密码JWT密钥：
```bash
openssl rand -base64 32
```

2. 更新 `.env` 中的安全配置：
```
JWT_SECRET=your_strong_random_secret_key
GIN_MODE=release
```

### 2. 数据库配置
1. 生产数据库连接字符串
2. Redis密码配置
3. 定期备份策略

### 3. 域名和SSL
1. 配置域名解析
2. 申请SSL证书
3. 更新回调URL为HTTPS

## 故障排除

### 常见问题
1. **数据库连接失败**
   - 检查PostgreSQL容器是否运行
   - 验证`.env`中的数据库配置

2. **OAuth回调失败**
   - 确认回调URL与平台配置一致
   - 检查网络连通性

3. **支付回调失败**
   - 验证回调URL可公开访问
   - 检查签名验证逻辑

4. **爬虫同步失败**
   - 检查GitHub Token权限
   - 查看同步日志

### 日志查看
```bash
# 查看后端日志
docker-compose logs -f backend

# 查看数据库日志
docker-compose logs -f postgres

# 查看前端日志
cd frontend && npm run dev
```

## 技术支持
- 项目文档：查看 `docs/` 目录
- API文档：访问 http://localhost:8080/swagger/index.html
- 问题反馈：创建GitHub Issue

---
*最后更新：2026-01-31*
*根据当前代码库状态生成*