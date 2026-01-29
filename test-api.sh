#!/bin/bash

echo "=== SkillHub API 测试 ==="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_BASE="http://localhost:8080/api/v1"

# 测试函数
test_api() {
  local name=$1
  local method=$2
  local url=$3
  local data=$4
  local auth=$5

  echo -n "测试 $name... "

  if [ -n "$auth" ]; then
    response=$(curl -s -X "$method" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $auth" \
      -d "$data" \
      "$url")
  else
    response=$(curl -s -X "$method" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$url")
  fi

  if echo "$response" | grep -q '"code":0\|"token":'; then
    echo -e "${GREEN}通过${NC}"
    return 0
  else
    echo -e "${RED}失败${NC}"
    echo "响应: $response"
    return 1
  fi
}

# 1. 健康检查
test_api "健康检查" "GET" "http://localhost:8080/health"

# 2. 登录
echo ""
echo "登录获取Token..."
login_response=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@skillhub.com","password":"admin123"}' \
  "$API_BASE/auth/login")

if echo "$login_response" | grep -q '"token"'; then
  TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  echo -e "${GREEN}登录成功${NC}"
else
  echo -e "${RED}登录失败${NC}"
  echo "响应: $login_response"
  exit 1
fi

# 3. 测试API端点
test_api "获取当前用户" "GET" "$API_BASE/auth/me" "" "$TOKEN"
test_api "获取热门技能" "GET" "$API_BASE/skills/hot" "" ""
test_api "获取趋势技能" "GET" "$API_BASE/skills/trending" "" ""
test_api "获取分类列表" "GET" "$API_BASE/skills/categories" "" ""
test_api "获取技能列表" "GET" "$API_BASE/skills" "" ""

# 4. 管理员API
echo ""
echo -e "${YELLOW}=== 管理员API测试 ===${NC}"
test_api "获取统计数据" "GET" "$API_BASE/admin/analytics" "" "$TOKEN"
test_api "获取用户列表" "GET" "$API_BASE/admin/users" "" "$TOKEN"
test_api "获取订单列表" "GET" "$API_BASE/admin/orders" "" "$TOKEN"
test_api "获取技能列表" "GET" "$API_BASE/admin/skills" "" "$TOKEN"

echo ""
echo -e "${GREEN}=== 测试完成 ===${NC}"
echo ""
echo "测试账号信息:"
echo "  管理员: admin@skillhub.com / admin123"
echo "  用户:   user@example.com / admin123"
echo ""
echo "服务地址:"
echo "  后端: http://localhost:8080"
echo "  前端: http://localhost:3001"
echo "  Swagger文档: http://localhost:8080/swagger/index.html"
