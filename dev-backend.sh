#!/bin/bash

echo "🚀 Starting Backend in development mode..."

# 检查.env文件
if [ ! -f .env ]; then
    echo "📋 Creating .env from .env.example..."
    cp .env.example .env
fi

# 启动数据库服务
docker-compose up -d postgres redis

# 启动后端开发服务
docker-compose -f docker-compose.dev.yml up -d backend

# 等待服务启动
echo "⏳ Waiting for backend to be ready..."
sleep 5

# 检查服务状态
echo "📊 Service status:"
docker-compose ps
docker-compose -f docker-compose.dev.yml ps

echo ""
echo "✅ Backend development mode started!"
echo ""
echo "🌐 Access URLs:"
echo "  Backend API:        http://localhost:8080"
echo "  API Docs:           http://localhost:8080/swagger/index.html"
echo ""
echo "📝 View logs:"
echo "  Backend:  docker-compose -f docker-compose.dev.yml logs -f backend"
echo "  Postgres: docker-compose logs -f postgres"
echo "  Redis:    docker-compose logs -f redis"
echo ""
echo "🛑 Stop with: docker-compose -f docker-compose.dev.yml down && docker-compose down"
echo ""
echo "🔄 Hot reload enabled - Go code changes will auto-restart the backend!"
