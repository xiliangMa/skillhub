package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRole string

const (
	RoleUser  UserRole = "user"
	RoleAdmin UserRole = "admin"
)

type User struct {
	ID           uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Email        string     `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	PasswordHash string     `gorm:"type:varchar(255)" json:"-"`
	Role         UserRole   `gorm:"type:varchar(50);default:'user'" json:"role"`
	IsActive     bool       `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time  `gorm:"autoUpdateTime" json:"updated_at"`

	// Relations
	Profile        UserProfile      `gorm:"foreignKey:UserID" json:"profile,omitempty"`
	OAuthProviders []OAuthProvider `gorm:"foreignKey:UserID" json:"oauth_providers,omitempty"`
	Orders         []Order         `gorm:"foreignKey:UserID" json:"orders,omitempty"`
}

type UserProfile struct {
	ID         uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	UserID     uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	AvatarURL  string     `gorm:"type:varchar(500)" json:"avatar_url"`
	Bio        string     `gorm:"type:text" json:"bio"`
	Preferences string     `gorm:"type:jsonb" json:"preferences"`
	CreatedAt  time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt  time.Time  `gorm:"autoUpdateTime" json:"updated_at"`

	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

type OAuthProvider struct {
	ID             uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	UserID         uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	Provider       string     `gorm:"type:varchar(50);not null;index:idx_provider" json:"provider"`
	ProviderUserID string     `gorm:"type:varchar(255);not null;index:idx_provider" json:"provider_user_id"`
	AccessToken    string     `gorm:"type:text;not null" json:"-"`
	RefreshToken   string     `gorm:"type:text" json:"-"`
	ExpiresAt      *time.Time `json:"expires_at,omitempty"`
	CreatedAt      time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt      time.Time  `gorm:"autoUpdateTime" json:"updated_at"`

	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}
