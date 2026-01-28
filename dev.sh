#!/bin/bash

echo "🚀 Starting SkillsHub in development mode..."

# 检查.env文件
if [ ! -f .env ]; then
    echo "📋 Creating .env from .env.example..."
    cp .env.example .env
fi

# 使用开发配置启动
docker-compose -f docker-compose.dev.yml up -d

# 等待数据库启动
echo "⏳ Waiting for services to be ready..."
sleep 5

# 检查服务状态
echo "📊 Service status:"
docker-compose -f docker-compose.dev.yml ps

echo ""
echo "✅ Development mode started!"
echo ""
echo "🌐 Access URLs:"
echo "  Frontend (dev):     http://localhost:3000"
echo "  Backend API:        http://localhost:8080"
echo "  API Docs:           http://localhost:8080/swagger/index.html"
echo ""
echo "📝 View logs with: docker-compose -f docker-compose.dev.yml logs -f"
echo "🛑 Stop with: docker-compose -f docker-compose.dev.yml down"
echo ""
echo "🔄 Hot reload enabled - code changes will auto-restart the services!"
