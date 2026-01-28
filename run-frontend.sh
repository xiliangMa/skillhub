#!/bin/bash

echo "🚀 Starting Frontend with npm run..."

cd /Users/maxiliang/work/code/skillhub/frontend

# 检查Node是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "💡 Please install Node.js first:"
    echo "   brew install node"
    echo ""
    echo "Or visit: https://nodejs.org/"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# 启动前端
echo "🚀 Starting frontend dev server..."
npm run dev
