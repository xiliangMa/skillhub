#!/bin/bash

# 停止开发环境所有服务

echo "🛑 停止开发环境服务..."

# 停止前端
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "  停止前端服务..."
    lsof -ti:3000 | xargs kill -9
fi

# 停止后端
if lsof -ti:8080 > /dev/null 2>&1; then
    echo "  停止后端服务..."
    lsof -ti:8080 | xargs kill -9
fi

# 停止数据库和 Redis
echo "  停止数据库服务..."
docker compose stop postgres redis

echo "✅ 所有服务已停止"
