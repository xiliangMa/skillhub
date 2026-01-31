package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
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
	// 微信使用自定义OAuth实现，不使用标准的oauth2.Config
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

// WeChatUserInfo 微信用户信息
type WeChatUserInfo struct {
	OpenID     string   `json:"openid"`
	UnionID    string   `json:"unionid"`
	Nickname   string   `json:"nickname"`
	Sex        int      `json:"sex"`
	Province   string   `json:"province"`
	City       string   `json:"city"`
	Country    string   `json:"country"`
	HeadImgURL string   `json:"headimgurl"`
	Privilege  []string `json:"privilege"`
	ErrCode    int      `json:"errcode"`
	ErrMsg     string   `json:"errmsg"`
}

// FeishuUserInfo 飞书用户信息
type FeishuUserInfo struct {
	Sub           string `json:"sub"`            // 用户唯一标识
	Name          string `json:"name"`           // 用户姓名
	Picture       string `json:"picture"`        // 用户头像
	OpenID        string `json:"open_id"`        // 用户 open_id
	UnionID       string `json:"union_id"`       // 用户 union_id
	Email         string `json:"email"`          // 用户邮箱
	EmailVerified bool   `json:"email_verified"` // 邮箱是否已验证
	Mobile        string `json:"mobile"`         // 用户手机号
	MobileVerified bool  `json:"mobile_verified"` // 手机号是否已验证
	EmployeeNo    string `json:"employee_no"`    // 员工工号
	EnterpriseEmail string `json:"enterprise_email"` // 企业邮箱
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
	// 请求用户基本信息和邮箱权限
	scope := "contact:user.base:readonly contact:user.email:readonly"
	url := fmt.Sprintf("https://open.feishu.cn/open-apis/authen/v1/authorize?app_id=%s&redirect_uri=%s&scope=%s&state=%s",
		cfg.AppID,
		cfg.Redirect,
		scope,
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
	cfg := config.AppConfig.OAuth.WeChat
	if cfg.AppID == "" || cfg.AppSecret == "" {
		return nil, fmt.Errorf("微信OAuth配置不完整")
	}

	// 1. 使用code获取access_token
	accessTokenURL := fmt.Sprintf(
		"https://api.weixin.qq.com/sns/oauth2/access_token?appid=%s&secret=%s&code=%s&grant_type=authorization_code",
		cfg.AppID,
		cfg.AppSecret,
		code,
	)

	resp, err := http.Get(accessTokenURL)
	if err != nil {
		return nil, fmt.Errorf("获取access_token失败: %v", err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取access_token响应失败: %v", err)
	}

	// 解析access_token响应
	var tokenResp struct {
		AccessToken  string `json:"access_token"`
		ExpiresIn    int    `json:"expires_in"`
		RefreshToken string `json:"refresh_token"`
		OpenID       string `json:"openid"`
		Scope        string `json:"scope"`
		UnionID      string `json:"unionid"`
		ErrCode      int    `json:"errcode"`
		ErrMsg       string `json:"errmsg"`
	}

	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return nil, fmt.Errorf("解析access_token响应失败: %v", err)
	}

	if tokenResp.ErrCode != 0 {
		return nil, fmt.Errorf("微信API错误: %d - %s", tokenResp.ErrCode, tokenResp.ErrMsg)
	}

	if tokenResp.AccessToken == "" || tokenResp.OpenID == "" {
		return nil, fmt.Errorf("无效的微信响应: access_token或openid为空")
	}

	// 2. 使用access_token和openid获取用户信息
	userInfoURL := fmt.Sprintf(
		"https://api.weixin.qq.com/sns/userinfo?access_token=%s&openid=%s",
		tokenResp.AccessToken,
		tokenResp.OpenID,
	)

	userResp, err := http.Get(userInfoURL)
	if err != nil {
		return nil, fmt.Errorf("获取用户信息失败: %v", err)
	}
	defer userResp.Body.Close()

	userBody, err := ioutil.ReadAll(userResp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取用户信息响应失败: %v", err)
	}

	var wechatUser WeChatUserInfo
	if err := json.Unmarshal(userBody, &wechatUser); err != nil {
		return nil, fmt.Errorf("解析用户信息失败: %v", err)
	}

	// 检查用户信息API是否返回错误
	if wechatUser.ErrCode != 0 {
		return nil, fmt.Errorf("微信用户信息API错误: %d - %s", wechatUser.ErrCode, wechatUser.ErrMsg)
	}

	if wechatUser.OpenID == "" {
		return nil, fmt.Errorf("无效的微信用户信息: openid为空")
	}

	// 3. 返回用户信息
	// 微信不提供邮箱，使用openid生成唯一邮箱
	email := fmt.Sprintf("wechat_%s@placeholder.com", tokenResp.OpenID)
	if tokenResp.UnionID != "" {
		// 优先使用unionid，因为它跨多个公众号/小程序是唯一的
		email = fmt.Sprintf("wechat_union_%s@placeholder.com", tokenResp.UnionID)
	}

	return &OAuthUserInfo{
		Email:    email,
		Name:     wechatUser.Nickname,
		Username: wechatUser.Nickname,
	}, nil
}

// HandleFeishuCallback 处理飞书OAuth回调
func HandleFeishuCallback(code, state string) (*OAuthUserInfo, error) {
	cfg := config.AppConfig.OAuth.Feishu
	if cfg.AppID == "" || cfg.AppSecret == "" {
		return nil, fmt.Errorf("飞书OAuth配置不完整")
	}

	// 1. 使用code获取access_token (飞书旧版OAuth)
	accessTokenURL := "https://open.feishu.cn/open-apis/authen/v1/access_token"

	// 构建请求体 (飞书旧版OAuth格式)
	reqBody := map[string]string{
		"grant_type":    "authorization_code",
		"client_id":     cfg.AppID,
		"client_secret": cfg.AppSecret,
		"code":          code,
		"redirect_uri":  cfg.Redirect,
	}

	reqBodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("序列化请求体失败: %v", err)
	}

	resp, err := http.Post(accessTokenURL, "application/json", strings.NewReader(string(reqBodyBytes)))
	if err != nil {
		return nil, fmt.Errorf("获取access_token失败: %v", err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取access_token响应失败: %v", err)
	}

	// 解析access_token响应 (飞书旧版OAuth格式)
	var tokenResp struct {
		Code         int    `json:"code"`
		Message      string `json:"msg"`
		Data         struct {
			AccessToken  string `json:"access_token"`
			TokenType    string `json:"token_type"`
			ExpiresIn    int    `json:"expires_in"`
			RefreshToken string `json:"refresh_token"`
			Scope        string `json:"scope"`
		} `json:"data"`
	}

	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return nil, fmt.Errorf("解析access_token响应失败: %v", err)
	}

	if tokenResp.Code != 0 {
		return nil, fmt.Errorf("飞书API错误: %d - %s", tokenResp.Code, tokenResp.Message)
	}

	if tokenResp.Data.AccessToken == "" {
		return nil, fmt.Errorf("无效的飞书响应: access_token为空")
	}

	// 2. 使用access_token获取用户信息
	userInfoURL := "https://open.feishu.cn/open-apis/authen/v1/user_info"

	req, err := http.NewRequest("GET", userInfoURL, nil)
	if err != nil {
		return nil, fmt.Errorf("创建用户信息请求失败: %v", err)
	}

	req.Header.Set("Authorization", "Bearer "+tokenResp.Data.AccessToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	userResp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("获取用户信息失败: %v", err)
	}
	defer userResp.Body.Close()

	userBody, err := ioutil.ReadAll(userResp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取用户信息响应失败: %v", err)
	}

	// 解析用户信息响应
	var userInfoResp struct {
		Code    int            `json:"code"`
		Message string         `json:"msg"`
		Data    FeishuUserInfo `json:"data"`
	}

	if err := json.Unmarshal(userBody, &userInfoResp); err != nil {
		return nil, fmt.Errorf("解析用户信息失败: %v", err)
	}

	if userInfoResp.Code != 0 {
		return nil, fmt.Errorf("飞书用户信息API错误: %d - %s", userInfoResp.Code, userInfoResp.Message)
	}

	feishuUser := userInfoResp.Data

	// 3. 返回用户信息
	// 优先使用邮箱，如果没有邮箱则使用open_id生成唯一邮箱
	email := feishuUser.Email
	if email == "" {
		if feishuUser.UnionID != "" {
			email = fmt.Sprintf("feishu_union_%s@placeholder.com", feishuUser.UnionID)
		} else if feishuUser.OpenID != "" {
			email = fmt.Sprintf("feishu_%s@placeholder.com", feishuUser.OpenID)
		} else {
			email = fmt.Sprintf("feishu_%s@placeholder.com", feishuUser.Sub)
		}
	}

	name := feishuUser.Name
	if name == "" {
		name = "Feishu User"
	}

	return &OAuthUserInfo{
		Email:    email,
		Name:     name,
		Username: name,
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
