.PHONY: help dev build deploy stop logs clean

help: ## 显示帮助信息
	@echo "可用命令:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## 启动开发环境
	docker-compose up -d

build: ## 构建所有服务
	docker-compose build

deploy: ## 部署到生产环境
	docker-compose -f docker-compose.prod.yml up -d

stop: ## 停止所有服务
	docker-compose down

logs: ## 查看日志
	docker-compose logs -f

clean: ## 清理所有容器和数据
	docker-compose down -v
	rm -rf data/*

init-db: ## 初始化数据库
	docker-compose exec postgres psql -U skillhub -d skillhub -f /docker-entrypoint-initdb.d/init.sql

migration: ## 运行数据库迁移
	cd backend && go run main.go migrate

swagger: ## 生成Swagger文档
	cd backend && swag init

test-backend: ## 运行后端测试
	cd backend && go test ./...

test-frontend: ## 运行前端测试
	cd frontend && npm test

restart: ## 重启所有服务
	docker-compose restart

ps: ## 查看运行中的容器
	docker-compose ps
