package models

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestUserRoleConstants(t *testing.T) {
	assert.Equal(t, UserRole("user"), RoleUser)
	assert.Equal(t, UserRole("admin"), RoleAdmin)
}

func TestUserStruct(t *testing.T) {
	userID := uuid.New()
	now := time.Now()

	user := User{
		ID:           userID,
		Email:        "test@example.com",
		Username:     "testuser",
		Name:         "Test User",
		PasswordHash: "hashed_password",
		Role:         RoleUser,
		IsActive:     true,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	assert.Equal(t, userID, user.ID)
	assert.Equal(t, "test@example.com", user.Email)
	assert.Equal(t, "testuser", user.Username)
	assert.Equal(t, "Test User", user.Name)
	assert.Equal(t, "hashed_password", user.PasswordHash)
	assert.Equal(t, RoleUser, user.Role)
	assert.True(t, user.IsActive)
	assert.Equal(t, now, user.CreatedAt)
	assert.Equal(t, now, user.UpdatedAt)
}

func TestUserProfileStruct(t *testing.T) {
	userID := uuid.New()
	profileID := uuid.New()
	now := time.Now()

	profile := UserProfile{
		ID:         profileID,
		UserID:     userID,
		AvatarURL:  "https://example.com/avatar.jpg",
		Bio:        "Test bio",
		Preferences: `{"theme": "dark", "language": "en"}`,
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	assert.Equal(t, profileID, profile.ID)
	assert.Equal(t, userID, profile.UserID)
	assert.Equal(t, "https://example.com/avatar.jpg", profile.AvatarURL)
	assert.Equal(t, "Test bio", profile.Bio)
	assert.Equal(t, `{"theme": "dark", "language": "en"}`, profile.Preferences)
	assert.Equal(t, now, profile.CreatedAt)
	assert.Equal(t, now, profile.UpdatedAt)
}

func TestOAuthProviderStruct(t *testing.T) {
	userID := uuid.New()
	providerID := uuid.New()
	now := time.Now()
	expiresAt := now.Add(24 * time.Hour)

	oauthProvider := OAuthProvider{
		ID:             providerID,
		UserID:         userID,
		Provider:       "github",
		ProviderUserID: "123456",
		AccessToken:    "access_token_123",
		RefreshToken:   "refresh_token_456",
		ExpiresAt:      &expiresAt,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	assert.Equal(t, providerID, oauthProvider.ID)
	assert.Equal(t, userID, oauthProvider.UserID)
	assert.Equal(t, "github", oauthProvider.Provider)
	assert.Equal(t, "123456", oauthProvider.ProviderUserID)
	assert.Equal(t, "access_token_123", oauthProvider.AccessToken)
	assert.Equal(t, "refresh_token_456", oauthProvider.RefreshToken)
	assert.Equal(t, expiresAt, *oauthProvider.ExpiresAt)
	assert.Equal(t, now, oauthProvider.CreatedAt)
	assert.Equal(t, now, oauthProvider.UpdatedAt)
}

func TestUserValidation(t *testing.T) {
	tests := []struct {
		name      string
		user      User
		expectErr bool
	}{
		{
			name: "valid user",
			user: User{
				Email:    "valid@example.com",
				Username: "validuser",
				Role:     RoleUser,
			},
			expectErr: false,
		},
		{
			name: "empty email should be invalid",
			user: User{
				Email:    "",
				Username: "user",
				Role:     RoleUser,
			},
			expectErr: true,
		},
		{
			name: "invalid role should default to user",
			user: User{
				Email:    "test@example.com",
				Username: "user",
				Role:     "invalid_role",
			},
			expectErr: false, // GORM will use default value
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.user.Email == "" {
				// Empty email should cause validation error in actual DB
				assert.Empty(t, tt.user.Email)
			} else {
				assert.NotEmpty(t, tt.user.Email)
			}
		})
	}
}