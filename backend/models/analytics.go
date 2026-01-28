package models

import (
	"time"

	"github.com/google/uuid"
)

type SkillAnalytics struct {
	ID             uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	SkillID        uuid.UUID  `gorm:"type:uuid;not null;index:idx_skill_date" json:"skill_id"`
	Date           time.Time  `gorm:"type:date;index:idx_skill_date" json:"date"`
	ViewsCount     int        `gorm:"default:0" json:"views_count"`
	DownloadsCount int        `gorm:"default:0" json:"downloads_count"`
	PurchasesCount int        `gorm:"default:0" json:"purchases_count"`

	Skill *Skill `gorm:"foreignKey:SkillID" json:"skill,omitempty"`
}

type SyncLog struct {
	ID                 uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	TaskName           string     `gorm:"type:varchar(255)" json:"task_name"`
	StartTime          time.Time  `json:"start_time"`
	EndTime            *time.Time `json:"end_time,omitempty"`
	NewSkillsCount     int        `gorm:"default:0" json:"new_skills_count"`
	UpdatedSkillsCount int        `gorm:"default:0" json:"updated_skills_count"`
	ErrorMessage       string     `gorm:"type:text" json:"error_message,omitempty"`
	Status             string     `gorm:"type:varchar(50)" json:"status"`
}

type ScheduledTask struct {
	ID             uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	TaskName       string     `gorm:"type:varchar(255);uniqueIndex;not null" json:"task_name"`
	CronExpression string     `gorm:"type:varchar(100)" json:"cron_expression"`
	IsActive       bool       `gorm:"default:true" json:"is_active"`
	Description    string     `gorm:"type:text" json:"description"`
	CreatedAt      time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt      time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
}
