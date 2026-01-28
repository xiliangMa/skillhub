#!/bin/bash

echo "🚀 Starting Backend with go run..."

cd /Users/maxiliang/work/code/skillhub/backend

# 检查Go是否安装
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install it first:"
    echo "   brew install golang"
    exit 1
fi

# 检查依赖
echo "📦 Checking dependencies..."
go mod tidy

# 启动后端
echo "🚀 Starting backend server..."
go run main.go
