#!/bin/bash

echo "🚀 Starting SkillsHub..."

# 检查.env文件
if [ ! -f .env ]; then
    echo "📋 Creating .env from .env.example..."
    cp .env.example .env
fi

# 启动所有服务
echo "🐳 Starting Docker containers..."
docker-compose up -d

# 等待数据库启动
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# 检查服务状态
echo "📊 Service status:"
docker-compose ps

echo ""
echo "✅ Services started!"
echo ""
echo "🌐 Access URLs:"
echo "  Frontend:     http://localhost:3000"
echo "  Backend API:  http://localhost:8080"
echo "  API Docs:     http://localhost:8080/swagger/index.html"
echo "  Nginx:        http://localhost"
echo ""
echo "📝 View logs with: docker-compose logs -f"
echo "🛑 Stop with: docker-compose down"
