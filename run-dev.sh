#!/bin/bash

# 完整开发环境启动脚本

echo "========================================"
echo "   Skills Hub 开发环境启动"
echo "========================================"

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装"
    exit 1
fi

# 启动数据库和 Redis
echo -e "\n📦 启动数据库服务 (PostgreSQL + Redis)..."
docker compose up -d postgres redis

# 等待服务就绪
echo "⏳ 等待数据库就绪..."
sleep 3

# 生成 Swagger 文档
echo "📝 生成 Swagger 文档..."
cd backend
~/go/bin/swag init -g main.go -o docs > /dev/null 2>&1
cd ..

# 启动后端服务
echo "🚀 启动后端服务 (Go)..."
cd backend
GIN_MODE=debug go run main.go > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "   后端 PID: $BACKEND_PID"
cd ..

# 等待后端启动
sleep 2

# 启动前端服务
echo "🎨 启动前端服务 (Next.js)..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "   安装前端依赖..."
    npm install --silent
fi
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   前端 PID: $FRONTEND_PID"
cd ..

# 等待服务启动
sleep 3

# 检查服务状态
echo -e "\n========================================"
echo "   服务状态检查"
echo "========================================"

if curl -s http://localhost:8080/health > /dev/null; then
    echo "✅ 后端服务: 正常 (http://localhost:8080)"
else
    echo "❌ 后端服务: 启动失败"
fi

if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ 前端服务: 正常 (http://localhost:3000)"
else
    echo "❌ 前端服务: 启动失败"
fi

echo -e "\n========================================"
echo "   快速访问"
echo "========================================"
echo "📱 前端页面:  http://localhost:3000"
echo "🔌 后端 API:  http://localhost:8080"
echo "📚 API 文档:  http://localhost:8080/swagger/index.html"
echo "💚 健康检查:  http://localhost:8080/health"
echo "========================================"
echo ""
echo "日志文件:"
echo "  后端: tail -f /tmp/backend.log"
echo "  前端: tail -f /tmp/frontend.log"
echo "========================================"
echo ""
echo "停止服务:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo "  或运行: ./stop-dev.sh"
echo "========================================"
