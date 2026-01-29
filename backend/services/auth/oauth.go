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

// GetGitHubAuthURL 获取GitHub OAuth授权URL
func GetGitHubAuthURL() (string, error) {
	if githubOAuthConfig == nil {
		return "", fmt.Errorf("GitHub OAuth not configured")
	}
	state := uuid.New().String()
	return githubOAuthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline), nil
}

// GetGoogleAuthURL 获取Google OAuth授权URL
func GetGoogleAuthURL() (string, error) {
	if googleOAuthConfig == nil {
		return "", fmt.Errorf("Google OAuth not configured")
	}
	state := uuid.New().String()
	return googleOAuthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline), nil
}

// GetWeChatAuthURL 获取微信OAuth授权URL
func GetWeChatAuthURL() (string, error) {
	cfg := config.AppConfig.OAuth.WeChat
	if cfg.AppID == "" {
		return "", fmt.Errorf("WeChat OAuth not configured")
	}
	// 微信OAuth授权URL格式
	state := uuid.New().String()
	url := fmt.Sprintf("https://open.weixin.qq.com/connect/qrconnect?appid=%s&redirect_uri=%s&response_type=code&scope=snsapi_login&state=%s#wechat_redirect",
		cfg.AppID,
		cfg.Redirect,
		state,
	)
	return url, nil
}

// GetFeishuAuthURL 获取飞书OAuth授权URL
func GetFeishuAuthURL() (string, error) {
	cfg := config.AppConfig.OAuth.Feishu
	if cfg.AppID == "" {
		return "", fmt.Errorf("Feishu OAuth not configured")
	}
	// 飞书OAuth授权URL格式
	state := uuid.New().String()
	url := fmt.Sprintf("https://open.feishu.cn/open-apis/authen/v1/authorize?app_id=%s&redirect_uri=%s&scope=contact:user.base:readonly&state=%s",
		cfg.AppID,
		cfg.Redirect,
		state,
	)
	return url, nil
}

// GetXiaohongshuAuthURL 获取小红书OAuth授权URL
func GetXiaohongshuAuthURL() (string, error) {
	cfg := config.AppConfig.OAuth.Xiaohongshu
	if cfg.AppID == "" {
		return "", fmt.Errorf("Xiaohongshu OAuth not configured")
	}
	// 小红书OAuth授权URL格式（示例）
	state := uuid.New().String()
	url := fmt.Sprintf("https://edith.xiaohongshu.com/api/sns/web/v2/login/authorize?appid=%s&redirect_uri=%s&response_type=code&scope=user.base.info&state=%s",
		cfg.AppID,
		cfg.Redirect,
		state,
	)
	return url, nil
}

// OAuthUserInfo OAuth用户信息结构
type OAuthUserInfo struct {
	Email    string `json:"email"`
	Name     string `json:"name"`
	Username string `json:"username"`
}

// HandleGitHubCallback 处理GitHub OAuth回调
func HandleGitHubCallback(code, state string) (*OAuthUserInfo, error) {
	// 获取token
	token, err := githubOAuthConfig.Exchange(context.Background(), code)
	if err != nil {
		return nil, err
	}

	// 获取用户信息
	client := githubOAuthConfig.Client(context.Background(), token)
	resp, err := client.Get("https://api.github.com/user")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var githubUser GitHubUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&githubUser); err != nil {
		return nil, err
	}

	return &OAuthUserInfo{
		Email:    githubUser.Email,
		Name:     githubUser.Name,
		Username: githubUser.Login,
	}, nil
}

// HandleGoogleCallback 处理Google OAuth回调
func HandleGoogleCallback(code, state string) (*OAuthUserInfo, error) {
	// 获取token
	token, err := googleOAuthConfig.Exchange(context.Background(), code)
	if err != nil {
		return nil, err
	}

	// 获取用户信息
	client := googleOAuthConfig.Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var googleUser GoogleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&googleUser); err != nil {
		return nil, err
	}

	return &OAuthUserInfo{
		Email: googleUser.Email,
		Name:  googleUser.Name,
	}, nil
}

// HandleWeChatCallback 处理微信OAuth回调
func HandleWeChatCallback(code, state string) (*OAuthUserInfo, error) {
	// 实现微信OAuth回调处理
	// 需要调用微信API获取access token和用户信息
	return &OAuthUserInfo{
		Email: fmt.Sprintf("wechat_user_%s@placeholder.com", state),
		Name:  "WeChat User",
	}, nil
}

// HandleFeishuCallback 处理飞书OAuth回调
func HandleFeishuCallback(code, state string) (*OAuthUserInfo, error) {
	// 实现飞书OAuth回调处理
	return &OAuthUserInfo{
		Email: fmt.Sprintf("feishu_user_%s@placeholder.com", state),
		Name:  "Feishu User",
	}, nil
}

// HandleXiaohongshuCallback 处理小红书OAuth回调
func HandleXiaohongshuCallback(code, state string) (*OAuthUserInfo, error) {
	// 实现小红书OAuth回调处理
	return &OAuthUserInfo{
		Email: fmt.Sprintf("xhs_user_%s@placeholder.com", state),
		Name:  "Xiaohongshu User",
	}, nil
}
