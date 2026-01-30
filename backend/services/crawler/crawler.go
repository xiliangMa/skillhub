package crawler

import (
	"log"
	"skillhub/config"
	"skillhub/models"
	"time"
)

// RunScheduledTask 执行定时任务
func RunScheduledTask(taskID string) error {
	log.Printf("Starting scheduled task: %s", taskID)

	switch taskID {
	case "daily_sync":
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
	// TODO: 实现SKILL.md格式解析器
	// SKILL.md格式示例:
	// ---
	// name: "AI代码助手"
	// description: "智能代码生成和重构工具"
	// price_type: "paid"
	// price: 29.99
	// category: "Development"
	// tags: ["AI", "Code", "Productivity"]
	// ---

	return &SkillMetadata{
		Name:        "示例技能",
		Description: "技能描述",
		PriceType:   models.PriceTypeFree,
		Price:       0,
		Category:    "其他",
		Tags:        []string{"示例"},
		GitHubURL:   "https://github.com/example/repo",
		Stars:       0,
		Forks:       0,
		LastUpdated: time.Now(),
	}, nil
}