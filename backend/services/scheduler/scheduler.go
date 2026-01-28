package scheduler

import (
	"log"
	"skillhub/config"
	"skillhub/models"
	// "skillhub/services/crawler"

	"github.com/robfig/cron/v3"
)

type Scheduler struct {
	cron *cron.Cron
}

var GlobalScheduler *Scheduler

// InitScheduler 初始化定时任务
func InitScheduler() {
	GlobalScheduler = &Scheduler{
		cron: cron.New(),
	}

	// 从数据库加载启用的定时任务
	loadScheduledTasks()

	// 启动定时任务
	GlobalScheduler.cron.Start()
	log.Println("Scheduler started")
}

// loadScheduledTasks 从数据库加载定时任务
func loadScheduledTasks() {
	db := models.GetDB()

	var tasks []models.ScheduledTask
	db.Where("is_enabled = ?", true).Find(&tasks)

	for _, task := range tasks {
		AddTask(task.TaskID, task.CronExpression)
	}
}

// AddTask 添加定时任务
func AddTask(taskID, cronExpression string) error {
	_, err := GlobalScheduler.cron.AddFunc(cronExpression, func() {
		log.Printf("Executing scheduled task: %s", taskID)
		// if err := crawler.RunScheduledTask(taskID); err != nil {
		// 	log.Printf("Error executing task %s: %v", taskID, err)
		// }
	})

	if err != nil {
		log.Printf("Error adding task %s: %v", taskID, err)
		return err
	}

	log.Printf("Added scheduled task: %s (cron: %s)", taskID, cronExpression)
	return nil
}

// RemoveTask 移除定时任务
func RemoveTask(taskID string) {
	// Note: cron.Cron doesn't provide direct removal by task ID
	// This would need task ID tracking in production
	log.Printf("Remove task called for: %s", taskID)
}

// Stop 停止定时任务
func (s *Scheduler) Stop() {
	s.cron.Stop()
	log.Println("Scheduler stopped")
}

// InitDefaultTasks 初始化默认定时任务
func InitDefaultTasks() {
	db := models.GetDB()

	// 默认每日凌晨3点同步
	tasks := []models.ScheduledTask{
		{
			TaskID:         "daily_sync",
			Name:           "每日数据同步",
			CronExpression: "0 3 * * *", // 每天3点
			IsEnabled:      config.AppConfig.Crawler.EnableAutoSync,
			Description:    "自动从GitHub同步Skills数据",
		},
	}

	for _, task := range tasks {
		var existingTask models.ScheduledTask
		if err := db.Where("task_id = ?", task.TaskID).First(&existingTask).Error; err != nil {
			db.Create(&task)
		}
	}
}
