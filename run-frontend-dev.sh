#!/bin/bash

# 开发模式启动前端服务

echo "=== Skills Hub Frontend 开发环境启动 ==="

cd frontend

# 检查 node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 启动前端服务
echo "🚀 启动前端服务 (Next.js Dev Mode)..."
npm run dev
