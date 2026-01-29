package models

import (
	"time"

	"github.com/google/uuid"
)

type DownloadRecord struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	SkillID   uuid.UUID `gorm:"type:uuid;not null;index:idx_user_skill" json:"skill_id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index:idx_user_skill" json:"user_id"`
	IPAddress string    `gorm:"type:varchar(50)" json:"ip_address,omitempty"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`

	Skill *Skill `gorm:"foreignKey:SkillID" json:"skill,omitempty"`
	User  *User  `gorm:"foreignKey:UserID" json:"user,omitempty"`
}
