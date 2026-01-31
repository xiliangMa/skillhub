#!/bin/bash

# 开发模式启动后端服务

echo "=== Skills Hub Backend 开发环境启动 ==="

# 检查是否需要启动 Docker
if ! pgrep -f "Docker" > /dev/null; then
    echo "⚠️  Docker 未运行"
    echo "请先启动 Docker，然后运行: open -a Docker"
    exit 1
fi

# 启动数据库和 Redis
echo "📦 启动 PostgreSQL 和 Redis..."
docker compose up -d postgres redis

# 等待数据库就绪
echo "⏳ 等待数据库就绪..."
sleep 5

# 启动后端服务
echo "🚀 启动后端服务..."
cd backend
DB_HOST=localhost REDIS_HOST=localhost GIN_MODE=debug go run main.go
