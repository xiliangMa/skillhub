#!/bin/bash

echo "=== SkillHub 国际化测试 ==="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}测试项目：${NC}"
echo "1. 检查i18n context文件"
echo "2. 检查页面是否使用i18n"
echo "3. 检查组件是否使用i18n"
echo "4. 测试语言切换功能"
echo ""

# 1. 检查i18n context
echo -e "${YELLOW}[1] 检查i18n context文件${NC}"
if [ -f "frontend/contexts/i18n-context.tsx" ]; then
  echo -e "${GREEN}✓ i18n context文件存在${NC}"
  
  # 检查是否有中英文翻译
  if grep -q 'en:' frontend/contexts/i18n-context.tsx && grep -q 'zh:' frontend/contexts/i18n-context.tsx; then
    echo -e "${GREEN}✓ 包含中英文翻译${NC}"
  else
    echo -e "${RED}✗ 缺少语言翻译${NC}"
  fi
else
  echo -e "${RED}✗ i18n context文件不存在${NC}"
fi
echo ""

# 2. 检查页面是否使用i18n
echo -e "${YELLOW}[2] 检查页面文件是否使用i18n${NC}"
pages=("frontend/app/page.tsx" "frontend/app/login/page.tsx" "frontend/app/skills/page.tsx" "frontend/app/skills/[id]/page.tsx" "frontend/app/admin/page.tsx")

for page in "${pages[@]}"; do
  if [ -f "$page" ]; then
    if grep -q 'useI18n' "$page"; then
      echo -e "${GREEN}✓ $(basename $page) 使用i18n${NC}"
    else
      echo -e "${RED}✗ $(basename $page) 未使用i18n${NC}"
    fi
  fi
done
echo ""

# 3. 检查组件是否使用i18n
echo -e "${YELLOW}[3] 检查组件文件是否使用i18n${NC}"
components=("frontend/components/layout/navbar.tsx" "frontend/components/layout/footer.tsx" "frontend/components/skill-card.tsx")

for component in "${components[@]}"; do
  if [ -f "$component" ]; then
    if grep -q 'useI18n' "$component"; then
      echo -e "${GREEN}✓ $(basename $component) 使用i18n${NC}"
    else
      echo -e "${RED}✗ $(basename $component) 未使用i18n${NC}"
    fi
  fi
done
echo ""

# 4. 检查是否有硬编码的中文或英文
echo -e "${YELLOW}[4] 检查硬编码文本${NC}"
echo "检查主要页面文件中的硬编码中文/英文..."

hardcoded_count=0
for page in "${pages[@]}"; do
  if [ -f "$page" ]; then
    # 检查是否有直接写在JSX中的中文（不在t.后面的）
    if grep -E '(["'"'"'])([\u4e00-\u9fa5]+|[A-Za-z\s]+)(["'"'"'])' "$page" | grep -v 't\.' | grep -v 'placeholder={' | grep -q .; then
      if [ $? -eq 0 ]; then
        echo -e "${RED}✗ $(basename $page) 可能包含硬编码文本${NC}"
        hardcoded_count=$((hardcoded_count + 1))
      fi
    fi
  fi
done

if [ $hardcoded_count -eq 0 ]; then
  echo -e "${GREEN}✓ 未发现明显的硬编码文本${NC}"
fi
echo ""

# 5. 检查语言切换器
echo -e "${YELLOW}[5] 检查语言切换组件${NC}"
if [ -f "frontend/components/language-switcher.tsx" ]; then
  echo -e "${GREEN}✓ 语言切换器组件存在${NC}"
  
  # 检查是否在导航栏中使用
  if grep -q 'LanguageSwitcher' frontend/components/layout/navbar.tsx; then
    echo -e "${GREEN}✓ 导航栏已集成语言切换器${NC}"
  else
    echo -e "${RED}✗ 导航栏未集成语言切换器${NC}"
  fi
else
  echo -e "${RED}✗ 语言切换器组件不存在${NC}"
fi
echo ""

# 6. 检查layout是否正确设置lang
echo -e "${YELLOW}[6] 检查HTML lang属性${NC}"
if grep -q 'lang="zh-CN"' frontend/app/layout.tsx; then
  echo -e "${GREEN}✓ HTML lang属性设置为zh-CN${NC}"
else
  echo -e "${RED}✗ HTML lang属性未正确设置${NC}"
fi
echo ""

echo -e "${GREEN}=== 国际化检查完成 ===${NC}"
echo ""
echo "访问地址："
echo "  - 英文: http://localhost:3001"
echo "  - 中文: http://localhost:3001/zh"
echo ""
echo "切换语言：点击导航栏上的语言选择器"
