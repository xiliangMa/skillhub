package crawler

import (
	"log"
	"skillhub/config"
	"skillhub/models"
	"time"

	"gorm.io/gorm"
)

// SyncEngine 智能同步引擎
type SyncEngine struct {
	db         *gorm.DB
	config     *config.GitHubConfig
	client     *GitHubClient
	lastSync   time.Time
	isFirstRun bool
}

// NewSyncEngine 创建同步引擎
func NewSyncEngine(db *gorm.DB, cfg *config.GitHubConfig) *SyncEngine {
	client := NewGitHubClient(cfg)

	// 检查是否是首次运行
	var syncLog models.SyncLog
	isFirstRun := db.Where("task_type = ?", "github_sync").First(&syncLog).Error != nil

	return &SyncEngine{
		db:         db,
		config:     cfg,
		client:     client,
		lastSync:   time.Now().Add(-24 * time.Hour), // 默认24小时前
		isFirstRun: isFirstRun,
	}
}

// Run 执行同步任务
func (e *SyncEngine) Run() error {
	log.Printf("Starting GitHub sync (strategy: %s, first run: %v)", e.config.SyncStrategy, e.isFirstRun)

	// 获取上次同步时间
	if err := e.loadLastSyncTime(); err != nil {
		log.Printf("Failed to load last sync time: %v", err)
	}

	// 根据策略选择同步方式
	switch e.config.SyncStrategy {
	case "full":
		return e.runFullSync()
	case "incremental":
		return e.runIncrementalSync()
	case "smart":
		return e.runSmartSync()
	default:
		log.Printf("Unknown sync strategy: %s, using smart", e.config.SyncStrategy)
		return e.runSmartSync()
	}
}

// runSmartSync 智能同步策略
func (e *SyncEngine) runSmartSync() error {
	if e.isFirstRun {
		log.Println("First run detected, performing full sync")
		return e.runFullSync()
	}

	// 检查是否需要全量刷新（每周一次）
	if e.needFullRefresh() {
		log.Println("Weekly full refresh triggered")
		return e.runFullSync()
	}

	// 否则执行增量同步
	log.Println("Performing incremental sync")
	return e.runIncrementalSync()
}

// runFullSync 全量同步
func (e *SyncEngine) runFullSync() error {
	log.Println("Starting full sync")
	startTime := time.Now()

	// 同步所有配置的主题
	for _, topic := range e.config.Topics {
		if err := e.syncTopic(topic, true); err != nil {
			log.Printf("Failed to sync topic %s: %v", topic, err)
			// 继续其他主题
		}
	}

	// 记录同步日志
	duration := time.Since(startTime)
	return e.recordSyncLog("github_sync", "full", duration, nil)
}

// runIncrementalSync 增量同步
func (e *SyncEngine) runIncrementalSync() error {
	log.Printf("Starting incremental sync (last sync: %v)", e.lastSync)
	startTime := time.Now()

	// 同步所有配置的主题
	for _, topic := range e.config.Topics {
		if err := e.syncTopic(topic, false); err != nil {
			log.Printf("Failed to sync topic %s: %v", topic, err)
			// 继续其他主题
		}
	}

	// 记录同步日志
	duration := time.Since(startTime)
	return e.recordSyncLog("github_sync", "incremental", duration, nil)
}

// syncTopic 同步特定主题
func (e *SyncEngine) syncTopic(topic string, fullSync bool) error {
	log.Printf("Syncing topic: %s (full: %v)", topic, fullSync)

	totalRepos := 0
	page := 1

	for page <= e.config.MaxPages {
		log.Printf("Fetching page %d for topic %s", page, topic)

		// 搜索仓库
		repos, resp, err := e.client.SearchRepositoriesByTopic(topic, page)
		if err != nil {
			return err
		}

		// 处理本页结果
		for _, repo := range repos {
			// 增量同步：检查仓库更新时间
			if !fullSync && repo.UpdatedAt != nil && repo.UpdatedAt.Time.Before(e.lastSync) {
				continue // 跳过未更新的仓库
			}

			// 转换为技能模型
			skill := e.client.ConvertToSkillModel(repo, topic)
			if skill == nil {
				continue
			}

			// 保存到数据库
			if err := e.saveOrUpdateSkill(skill); err != nil {
				log.Printf("Failed to save skill %s: %v", skill.Name, err)
			} else {
				totalRepos++
			}
		}

		// 检查是否还有更多页面
		if len(repos) < e.config.PerPage {
			break
		}

		// 检查速率限制
		if resp != nil && resp.Rate.Remaining < 10 {
			log.Printf("Rate limit low: %d remaining, reset at %v", resp.Rate.Remaining, resp.Rate.Reset.Time)
			time.Sleep(5 * time.Second)
		}

		page++
	}

	log.Printf("Topic %s sync completed: %d repos processed", topic, totalRepos)
	return nil
}

// saveOrUpdateSkill 保存或更新技能到数据库
func (e *SyncEngine) saveOrUpdateSkill(skill *models.Skill) error {
	var existingSkill models.Skill
	result := e.db.Where("github_url = ?", skill.GitHubURL).First(&existingSkill)

	if result.Error == nil {
		// 更新现有技能
		existingSkill.Name = skill.Name
		existingSkill.Description = skill.Description
		existingSkill.StarsCount = skill.StarsCount
		existingSkill.ForksCount = skill.ForksCount
		existingSkill.LastSyncAt = skill.LastSyncAt
		existingSkill.SyncSource = skill.SyncSource
		// 保留现有的CategoryID和Tags

		return e.db.Save(&existingSkill).Error
	}

	// 创建新技能
	return e.db.Create(skill).Error
}

// loadLastSyncTime 加载上次同步时间
func (e *SyncEngine) loadLastSyncTime() error {
	var syncLog models.SyncLog
	result := e.db.Where("task_name = ?", "github_sync").
		Order("start_time DESC").
		First(&syncLog)

	if result.Error == nil && syncLog.EndTime != nil {
		e.lastSync = *syncLog.EndTime
	} else if result.Error == nil {
		e.lastSync = syncLog.StartTime
	}

	return result.Error
}

// needFullRefresh 检查是否需要全量刷新
func (e *SyncEngine) needFullRefresh() bool {
	// 每周一执行全量刷新
	now := time.Now()
	lastMonday := now.AddDate(0, 0, -int(now.Weekday())+1) // 本周一
	return e.lastSync.Before(lastMonday)
}

// recordSyncLog 记录同步日志
func (e *SyncEngine) recordSyncLog(taskType, strategy string, duration time.Duration, err error) error {
	status := "success"
	errorMsg := ""
	if err != nil {
		status = "failed"
		errorMsg = err.Error()
	}

	startTime := time.Now().Add(-duration)
	syncLog := &models.SyncLog{
		TaskName:           taskType,
		StartTime:          startTime,
		EndTime:            &[]time.Time{time.Now()}[0],
		Status:             status,
		ErrorMessage:       errorMsg,
		NewSkillsCount:     0,    // 可以后续统计
		UpdatedSkillsCount: 0,    // 可以后续统计
	}

	return e.db.Create(syncLog).Error
}