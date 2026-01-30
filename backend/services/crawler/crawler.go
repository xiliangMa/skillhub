package crawler

import (
	"log"
	"skillhub/config"
	"skillhub/models"
	"strconv"
	"strings"
	"time"
)

// RunScheduledTask 执行定时任务
func RunScheduledTask(taskID string) error {
	log.Printf("Starting scheduled task: %s", taskID)

	switch taskID {
	case "sync_github_skills", "daily_sync":
		return syncGitHubSkills()
	default:
		log.Printf("Unknown task ID: %s", taskID)
		return nil
	}
}

// syncGitHubSkills 从GitHub同步技能数据
func syncGitHubSkills() error {
	log.Println("Starting GitHub skills sync")

	// 获取配置
	cfg := config.AppConfig
	if cfg.GitHub.Token == "" {
		log.Println("GitHub token not configured, skipping sync")
		return nil
	}

	// 获取数据库连接
	db := models.GetDB()
	if db == nil {
		log.Println("Database not initialized, skipping sync")
		return nil
	}

	// 创建同步引擎并执行同步
	syncEngine := NewSyncEngine(db, &cfg.GitHub)
	if err := syncEngine.Run(); err != nil {
		log.Printf("GitHub sync failed: %v", err)
		return err
	}

	log.Println("GitHub skills sync completed")
	return nil
}

// SkillMetadata 从SKILL.md解析出的技能元数据
type SkillMetadata struct {
	Name        string
	Description string
	PriceType   models.PriceType
	Price       float64
	Category    string
	Tags        []string
	GitHubURL   string
	Stars       int
	Forks       int
	LastUpdated time.Time
}

// parseSkillMetadata 从SKILL.md内容解析元数据
func parseSkillMetadata(content string) (*SkillMetadata, error) {
	// SKILL.md格式示例:
	// ---
	// name: "AI代码助手"
	// description: "智能代码生成和重构工具"
	// price_type: "paid"
	// price: 29.99
	// category: "Development"
	// tags: ["AI", "Code", "Productivity"]
	// ---

	// 简化实现：解析YAML frontmatter
	// 在实际实现中，可以使用yaml.v3库进行解析
	// 这里先实现一个简单的解析逻辑

	lines := strings.Split(content, "\n")
	inFrontmatter := false
	var frontmatterLines []string

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		if trimmed == "---" {
			if inFrontmatter {
				// 结束frontmatter
				break
			} else {
				// 开始frontmatter
				inFrontmatter = true
				continue
			}
		}

		if inFrontmatter {
			frontmatterLines = append(frontmatterLines, line)
		}
	}

	// 如果没有找到frontmatter，返回默认值
	if len(frontmatterLines) == 0 {
		return &SkillMetadata{
			Name:        "未命名技能",
			Description: "从GitHub仓库自动同步",
			PriceType:   models.PriceTypeFree,
			Price:       0,
			Category:    "其他",
			Tags:        []string{"GitHub"},
			GitHubURL:   "",
			Stars:       0,
			Forks:       0,
			LastUpdated: time.Now(),
		}, nil
	}

	// 简单解析key-value对
	metadata := make(map[string]string)
	for _, line := range frontmatterLines {
		parts := strings.SplitN(line, ":", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			value := strings.TrimSpace(parts[1])
			// 移除可能的引号
			value = strings.Trim(value, "\"'")
			metadata[key] = value
		}
	}

	// 解析价格类型
	priceType := models.PriceTypeFree
	if pt, ok := metadata["price_type"]; ok {
		if pt == "paid" {
			priceType = models.PriceTypePaid
		}
	}

	// 解析价格
	price := 0.0
	if p, ok := metadata["price"]; ok {
		if parsedPrice, err := strconv.ParseFloat(p, 64); err == nil {
			price = parsedPrice
		}
	}

	// 解析标签
	var tags []string
	if tagStr, ok := metadata["tags"]; ok {
		// 简单解析数组格式 [tag1, tag2, tag3]
		tagStr = strings.Trim(tagStr, "[]")
		tagParts := strings.Split(tagStr, ",")
		for _, tag := range tagParts {
			tag = strings.TrimSpace(tag)
			tag = strings.Trim(tag, "\"'")
			if tag != "" {
				tags = append(tags, tag)
			}
		}
	}

	return &SkillMetadata{
		Name:        getStringOrDefault(metadata, "name", "未命名技能"),
		Description: getStringOrDefault(metadata, "description", "从GitHub仓库自动同步"),
		PriceType:   priceType,
		Price:       price,
		Category:    getStringOrDefault(metadata, "category", "其他"),
		Tags:        tags,
		GitHubURL:   getStringOrDefault(metadata, "github_url", ""),
		Stars:       0, // 这些值将从GitHub API获取
		Forks:       0,
		LastUpdated: time.Now(),
	}, nil
}

// getStringOrDefault 从map获取字符串或返回默认值
func getStringOrDefault(m map[string]string, key, defaultValue string) string {
	if value, ok := m[key]; ok && value != "" {
		return value
	}
	return defaultValue
}