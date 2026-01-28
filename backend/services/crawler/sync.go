package crawler

import (
	"log"
	"skillhub/models"
	"time"
)

// SyncLog 记录同步日志
func SyncLog(taskID string, startTime time.Time, newCount, updateCount int) error {
	db := models.GetDB()

	syncLog := models.SyncLog{
		TaskID:     taskID,
		StartTime:  startTime,
		EndTime:    time.Now(),
		NewCount:   newCount,
		UpdateCount: updateCount,
		Status:     "completed",
	}

	return db.Create(&syncLog).Error
}

// RunScheduledTask 执行定时爬取任务
func RunScheduledTask(taskID string) error {
	log.Printf("Starting scheduled task: %s", taskID)
	startTime := time.Now()

	// 加载任务配置
	db := models.GetDB()
	var task models.ScheduledTask
	if err := db.Where("task_id = ?", taskID).First(&task).Error; err != nil {
		log.Printf("Error loading task %s: %v", taskID, err)
		return err
	}

	// 检查任务是否启用
	if !task.IsEnabled {
		log.Printf("Task %s is disabled, skipping", taskID)
		return nil
	}

	// 执行爬取
	crawler := NewGitHubCrawler()

	var newCount, updateCount int

	// 从GitHub topics爬取
	topics := []string{"ai-assistant", "chatgpt", "llm", "agent", "skill"}
	if err := crawler.CrawlSkillsFromTopics(topics, 20); err != nil {
		log.Printf("Error crawling from topics: %v", err)
	}

	// 从特定仓库爬取
	repos := []string{
		"microsoft/semantic-kernel",
		"openai/openai-quickstart-python",
		"langchain-ai/langchain",
	}
	if err := crawler.CrawlSkillsByRepos(repos); err != nil {
		log.Printf("Error crawling from repos: %v", err)
	}

	// 更新任务执行时间
	task.LastRunAt = time.Now()
	task.RunCount++
	db.Save(&task)

	// 记录同步日志
	if err := SyncLog(taskID, startTime, newCount, updateCount); err != nil {
		log.Printf("Error saving sync log: %v", err)
	}

	log.Printf("Completed scheduled task: %s in %v", taskID, time.Since(startTime))
	return nil
}
