package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"skillhub/config"
	"skillhub/lib"
	"skillhub/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	"golang.org/x/oauth2/google"
)

var (
	githubOAuthConfig *oauth2.Config
	googleOAuthConfig *oauth2.Config
)

func InitOAuth() {
	cfg := config.AppConfig.OAuth

	// GitHub OAuth
	githubOAuthConfig = &oauth2.Config{
		ClientID:     cfg.GitHub.AppID,
		ClientSecret: cfg.GitHub.AppSecret,
		RedirectURL:  cfg.GitHub.Redirect,
		Scopes:       []string{"user:email"},
		Endpoint:     github.Endpoint,
	}

	// Google OAuth
	googleOAuthConfig = &oauth2.Config{
		ClientID:     cfg.Google.AppID,
		ClientSecret: cfg.Google.AppSecret,
		RedirectURL:  cfg.Google.Redirect,
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"},
		Endpoint:     google.Endpoint,
	}
}

// OAuthCallbackResponse OAuth回调响应
type OAuthCallbackResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

// GitHubUserInfo GitHub用户信息
type GitHubUserInfo struct {
	ID       int64  `json:"id"`
	Login    string `json:"login"`
	Email    string `json:"email"`
	Name     string `json:"name"`
	Avatar   string `json:"avatar_url"`
	Bio      string `json:"bio"`
	Location string `json:"location"`
}

// GoogleUserInfo Google用户信息
type GoogleUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
}

// OAuthLogin OAuth登录
// @Summary OAuth登录
// @Description 使用OAuth第三方登录
// @Tags auth
// @Param provider path string true "OAuth provider (github, google)"
// @Router /auth/oauth/{provider} [get]
func OAuthLogin(c *gin.Context) {
	provider := c.Param("provider")

	var url string
	var state = uuid.New().String()

	switch provider {
	case "github":
		url = githubOAuthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
	case "google":
		url = googleOAuthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported OAuth provider"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"auth_url": url})
}

// GitHubCallback GitHub OAuth回调
// @Summary GitHub OAuth回调
// @Description GitHub OAuth登录回调
// @Tags auth
// @Param code query string true "Authorization code"
// @Router /auth/callback/github [get]
func GitHubCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing authorization code"})
		return
	}

	// 获取token
	token, err := githubOAuthConfig.Exchange(context.Background(), code)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to exchange token"})
		return
	}

	// 获取用户信息
	client := githubOAuthConfig.Client(context.Background(), token)
	resp, err := client.Get("https://api.github.com/user")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to get user info"})
		return
	}
	defer resp.Body.Close()

	var githubUser GitHubUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&githubUser); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to decode user info"})
		return
	}

	// 处理用户
	user, err := handleOAuthUser("github", fmt.Sprintf("%d", githubUser.ID), githubUser.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// 生成JWT token
	jwtToken, err := lib.GenerateToken(user.ID, user.Email, string(user.Role))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, OAuthCallbackResponse{
		Token: jwtToken,
		User:  *user,
	})
}

// GoogleCallback Google OAuth回调
// @Summary Google OAuth回调
// @Description Google OAuth登录回调
// @Tags auth
// @Param code query string true "Authorization code"
// @Router /auth/callback/google [get]
func GoogleCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing authorization code"})
		return
	}

	// 获取token
	token, err := googleOAuthConfig.Exchange(context.Background(), code)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to exchange token"})
		return
	}

	// 获取用户信息
	client := googleOAuthConfig.Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to get user info"})
		return
	}
	defer resp.Body.Close()

	var googleUser GoogleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&googleUser); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to decode user info"})
		return
	}

	// 处理用户
	user, err := handleOAuthUser("google", googleUser.ID, googleUser.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// 生成JWT token
	jwtToken, err := lib.GenerateToken(user.ID, user.Email, string(user.Role))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, OAuthCallbackResponse{
		Token: jwtToken,
		User:  *user,
	})
}

// handleOAuthUser 处理OAuth用户
func handleOAuthUser(provider, providerUserID, email string) (*models.User, error) {
	// 查找是否已有OAuth绑定
	var oauthProvider models.OAuthProvider
	err := models.DB.Where("provider = ? AND provider_user_id = ?", provider, providerUserID).First(&oauthProvider).Error

	if err == nil {
		// 已存在，返回用户
		var user models.User
		if err := models.DB.First(&user, "id = ?", oauthProvider.UserID).Error; err != nil {
			return nil, err
		}
		user.PasswordHash = ""
		return &user, nil
	}

	// 不存在，创建新用户或绑定
	var user models.User
	err = models.DB.Where("email = ?", email).First(&user).Error

	if err != nil {
		// 创建新用户
		user = models.User{
			ID:       uuid.New(),
			Email:    email,
			Role:     models.RoleUser,
			IsActive: true,
		}
		if err := models.DB.Create(&user).Error; err != nil {
			return nil, err
		}

		// 创建用户档案
		profile := models.UserProfile{
			ID:     uuid.New(),
			UserID: user.ID,
		}
		models.DB.Create(&profile)
	}

	// 创建OAuth绑定
	oauthProvider = models.OAuthProvider{
		ID:             uuid.New(),
		UserID:         user.ID,
		Provider:       provider,
		ProviderUserID:  providerUserID,
		AccessToken:    "", // 实际应用中应该保存token
	}
	models.DB.Create(&oauthProvider)

	user.PasswordHash = ""
	return &user, nil
}
