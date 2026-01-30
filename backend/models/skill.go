package models

import (
	"time"

	"github.com/google/uuid"
)

type PriceType string

const (
	PriceTypeFree PriceType = "free"
	PriceTypePaid PriceType = "paid"
)

type SkillCategory struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Name      string         `gorm:"type:varchar(255);not null" json:"name"`
	ParentID  *uuid.UUID     `gorm:"type:uuid;index" json:"parent_id,omitempty"`
	SortOrder int            `gorm:"default:0" json:"sort_order"`
	CreatedAt time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time      `gorm:"autoUpdateTime" json:"updated_at"`

	Parent   *SkillCategory `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Children []SkillCategory `gorm:"foreignKey:ParentID" json:"children,omitempty"`
	Skills   []Skill         `gorm:"foreignKey:CategoryID" json:"skills,omitempty"`
}

type SkillTag struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Name      string    `gorm:"type:varchar(255);uniqueIndex;not null" json:"name"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

type Skill struct {
	ID             uuid.UUID        `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Name           string           `gorm:"type:varchar(255);not null" json:"name"`
	Description    string           `gorm:"type:text" json:"description"`
	GitHubURL      string           `gorm:"type:varchar(500)" json:"github_url"`
	CategoryID     *uuid.UUID       `gorm:"type:uuid;index" json:"category_id,omitempty"`
	PriceType      PriceType        `gorm:"type:varchar(20);default:'free'" json:"price_type"`
	Price          float64          `gorm:"type:decimal(10,2);default:0.00" json:"price"`
	DownloadsCount int              `gorm:"default:0" json:"downloads_count"`
	PurchasesCount int              `gorm:"default:0" json:"purchases_count"`
	Rating         float64          `gorm:"type:decimal(3,2);default:0.00" json:"rating"`
	StarsCount     int              `gorm:"default:0" json:"stars_count"`
	ForksCount     int              `gorm:"default:0" json:"forks_count"`
	IsActive       bool             `gorm:"default:true;index" json:"is_active"`
	LastSyncAt     *time.Time       `json:"last_sync_at,omitempty"`
	SyncSource     string           `gorm:"type:varchar(100);default:'manual'" json:"sync_source"`
	CreatedAt      time.Time        `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt      time.Time        `gorm:"autoUpdateTime" json:"updated_at"`

	// Relations
	Category     *SkillCategory     `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Tags         []SkillTag         `gorm:"many2many:skill_tag_relations;" json:"tags,omitempty"`
	Translations []SkillTranslation `gorm:"foreignKey:SkillID" json:"translations,omitempty"`
	OrderItems   []OrderItem        `gorm:"foreignKey:SkillID" json:"order_items,omitempty"`
	Analytics    []SkillAnalytics    `gorm:"foreignKey:SkillID" json:"analytics,omitempty"`
}

type SkillTranslation struct {
	ID          uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	SkillID     uuid.UUID  `gorm:"type:uuid;not null;index" json:"skill_id"`
	Language    string     `gorm:"type:varchar(10);not null" json:"language"`
	Title       string     `gorm:"type:varchar(255)" json:"title"`
	Description string     `gorm:"type:text" json:"description"`
	CreatedAt   time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time  `gorm:"autoUpdateTime" json:"updated_at"`

	Skill *Skill `gorm:"foreignKey:SkillID" json:"skill,omitempty"`
}
