package auth

import (
	"encoding/json"
	"fmt"
	"net/http"
	"skillhub/lib"
	"skillhub/models"
	svcauth "skillhub/services/auth"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// LoginRequest 登录请求
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse 登录响应
type LoginResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

// RegisterRequest 注册请求
type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// Login 用户登录
// @Summary 用户登录
// @Description 用户邮箱密码登录
// @Tags auth
// @Accept json
// @Produce json
// @Param request body LoginRequest true "登录信息"
// @Success 200 {object} LoginResponse
// @Router /auth/login [post]
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 查找用户
	var user models.User
	if err := models.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// 验证密码
	if !lib.CheckPassword(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// 生成JWT token
	token, err := lib.GenerateToken(user.ID, user.Email, string(user.Role))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// 清除敏感信息
	user.PasswordHash = ""

	c.JSON(http.StatusOK, LoginResponse{
		Token: token,
		User:  user,
	})
}

// Register 用户注册
// @Summary 用户注册
// @Description 新用户注册
// @Tags auth
// @Accept json
// @Produce json
// @Param request body RegisterRequest true "注册信息"
// @Success 200 {object} LoginResponse
// @Router /auth/register [post]
func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查邮箱是否已存在
	var existingUser models.User
	if err := models.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already exists"})
		return
	}

	// 哈希密码
	passwordHash, err := lib.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// 创建用户
	user := models.User{
		ID:           uuid.New(),
		Email:        req.Email,
		Name:         req.Name,
		PasswordHash: passwordHash,
		Role:         models.RoleUser,
		IsActive:     true,
	}

	if err := models.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// 创建用户档案
	profile := models.UserProfile{
		ID:     uuid.New(),
		UserID: user.ID,
	}
	models.DB.Create(&profile)

	// 生成JWT token
	token, err := lib.GenerateToken(user.ID, user.Email, string(user.Role))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// 清除敏感信息
	user.PasswordHash = ""

	c.JSON(http.StatusOK, LoginResponse{
		Token: token,
		User:  user,
	})
}

// GetMe 获取当前用户信息
// @Summary 获取当前用户信息
// @Description 获取当前登录用户的信息
// @Tags auth
// @Accept json
// @Produce json
// @Security Bearer
// @Success 200 {object} models.User
// @Router /auth/me [get]
func GetMe(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var user models.User
	if err := models.DB.Preload("Profile").First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// 清除敏感信息
	user.PasswordHash = ""

	c.JSON(http.StatusOK, user)
}

// OAuthLogin OAuth登录
// @Summary OAuth登录
// @Description OAuth第三方登录，支持微信、飞书、小红书、GitHub、Google
// @Tags auth
// @Accept json
// @Produce json
// @Param provider path string true "OAuth提供商: wechat, feishu, xiaohongshu, github, google"
// @Router /auth/oauth/{provider} [get]
func OAuthLogin(c *gin.Context) {
	provider := c.Param("provider")
	
	// 支持的OAuth提供商
	validProviders := map[string]bool{
		"wechat":      true,
		"feishu":      true,
		"xiaohongshu": true,
		"github":      true,
		"google":      true,
	}

	if !validProviders[provider] {
		c.JSON(400, gin.H{
			"error": "Unsupported OAuth provider",
			"message": fmt.Sprintf("Provider '%s' is not supported. Valid providers: wechat, feishu, xiaohongshu, github, google", provider),
		})
		return
	}

	var oauthURL string
	var err error

	switch provider {
	case "github":
		oauthURL, err = svcauth.GetGitHubAuthURL()
	case "google":
		oauthURL, err = svcauth.GetGoogleAuthURL()
	case "wechat":
		oauthURL, err = svcauth.GetWeChatAuthURL()
	case "feishu":
		oauthURL, err = svcauth.GetFeishuAuthURL()
	case "xiaohongshu":
		oauthURL, err = svcauth.GetXiaohongshuAuthURL()
	}

	if err != nil {
		c.JSON(500, gin.H{
			"error": "Failed to generate OAuth URL",
			"message": err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"message": "Redirect to OAuth provider",
		"provider": provider,
		"auth_url": oauthURL,
	})
}

// GitHubCallback GitHub回调
// @Summary GitHub OAuth回调
// @Description GitHub OAuth登录回调
// @Tags auth
// @Accept json
// @Produce json
// @Param code query string true "OAuth授权码"
// @Param state query string true "状态参数"
// @Router /auth/callback/github [get]
func GitHubCallback(c *gin.Context) {
	code := c.Query("code")
	state := c.Query("state")

	if code == "" {
		c.JSON(400, gin.H{"error": "Missing authorization code"})
		return
	}

	// 使用GitHub OAuth服务处理回调
	userInfo, err := svcauth.HandleGitHubCallback(code, state)
	if err != nil {
		c.JSON(500, gin.H{
			"error": "Failed to handle GitHub callback",
			"message": err.Error(),
		})
		return
	}

	// 查找或创建用户
	var user models.User
	err = models.DB.Where("email = ?", userInfo.Email).First(&user).Error
	if err != nil {
		// 创建新用户
		user = models.User{
			ID:       uuid.New(),
			Email:    userInfo.Email,
			Username: userInfo.Username,
			Name:     userInfo.Name,
			PasswordHash: "", // OAuth用户没有密码
			Role:     models.RoleUser,
			IsActive: true,
		}
		if err := models.DB.Create(&user).Error; err != nil {
			c.JSON(500, gin.H{"error": "Failed to create user"})
			return
		}
	} else {
		// 如果用户已存在但没有名称，更新名称
		if user.Name == "" && userInfo.Name != "" {
			user.Name = userInfo.Name
			models.DB.Save(&user)
		}
		if user.Username == "" && userInfo.Username != "" {
			user.Username = userInfo.Username
			models.DB.Save(&user)
		}
	}

	// 生成JWT token
	token, err := lib.GenerateToken(user.ID, user.Email, string(user.Role))
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to generate token"})
		return
	}

	// 清除敏感信息
	user.PasswordHash = ""

	c.JSON(200, LoginResponse{
		Token: token,
		User:  user,
	})
}

// GoogleCallback Google回调
// @Summary Google OAuth回调
// @Description Google OAuth登录回调
// @Tags auth
// @Accept json
// @Produce json
// @Param code query string true "OAuth授权码"
// @Param state query string true "状态参数"
// @Router /auth/callback/google [get]
func GoogleCallback(c *gin.Context) {
	code := c.Query("code")
	state := c.Query("state")

	if code == "" {
		c.JSON(400, gin.H{"error": "Missing authorization code"})
		return
	}

	// 使用Google OAuth服务处理回调
	userInfo, err := svcauth.HandleGoogleCallback(code, state)
	if err != nil {
		c.JSON(500, gin.H{
			"error": "Failed to handle Google callback",
			"message": err.Error(),
		})
		return
	}

	// 查找或创建用户
	var user models.User
	err = models.DB.Where("email = ?", userInfo.Email).First(&user).Error
	if err != nil {
		// 创建新用户
		user = models.User{
			ID:       uuid.New(),
			Email:    userInfo.Email,
			Name:     userInfo.Name,
			PasswordHash: "", // OAuth用户没有密码
			Role:     models.RoleUser,
			IsActive: true,
		}
		if err := models.DB.Create(&user).Error; err != nil {
			c.JSON(500, gin.H{"error": "Failed to create user"})
			return
		}
	} else {
		// 如果用户已存在但没有名称，更新名称
		if user.Name == "" && userInfo.Name != "" {
			user.Name = userInfo.Name
			models.DB.Save(&user)
		}
	}

	// 生成JWT token
	token, err := lib.GenerateToken(user.ID, user.Email, string(user.Role))
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to generate token"})
		return
	}

	// 清除敏感信息
	user.PasswordHash = ""

	c.JSON(200, LoginResponse{
		Token: token,
		User:  user,
	})
}

// WeChatCallback 微信回调
// @Summary 微信OAuth回调
// @Description 微信OAuth登录回调
// @Tags auth
// @Accept json
// @Produce json
// @Param code query string true "OAuth授权码"
// @Param state query string true "状态参数"
// @Router /auth/callback/wechat [get]
func WeChatCallback(c *gin.Context) {
	code := c.Query("code")
	state := c.Query("state")

	if code == "" {
		c.JSON(400, gin.H{"error": "Missing authorization code"})
		return
	}

	// 使用微信OAuth服务处理回调
	userInfo, err := svcauth.HandleWeChatCallback(code, state)
	if err != nil {
		c.JSON(500, gin.H{
			"error": "Failed to handle WeChat callback",
			"message": err.Error(),
		})
		return
	}

	// 查找或创建用户
	var user models.User
	err = models.DB.Where("email = ?", userInfo.Email).First(&user).Error
	if err != nil {
		// 创建新用户
		user = models.User{
			ID:           uuid.New(),
			Email:        userInfo.Email,
			Username:     userInfo.Username,
			Name:         userInfo.Name,
			PasswordHash: "", // OAuth用户没有密码
			Role:         models.RoleUser,
			IsActive:     true,
		}
		if err := models.DB.Create(&user).Error; err != nil {
			c.JSON(500, gin.H{"error": "Failed to create user"})
			return
		}
	} else {
		// 如果用户已存在但没有名称，更新名称
		if user.Name == "" && userInfo.Name != "" {
			user.Name = userInfo.Name
			models.DB.Save(&user)
		}
		if user.Username == "" && userInfo.Username != "" {
			user.Username = userInfo.Username
			models.DB.Save(&user)
		}
	}

	// 生成JWT token
	token, err := lib.GenerateToken(user.ID, user.Email, string(user.Role))
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to generate token"})
		return
	}

	// 清除敏感信息
	user.PasswordHash = ""

	c.JSON(200, LoginResponse{
		Token: token,
		User:  user,
	})
}

// FeishuCallback 飞书回调
// @Summary 飞书OAuth回调
// @Description 飞书OAuth登录回调
// @Tags auth
// @Accept json
// @Produce json
// @Param code query string true "OAuth授权码"
// @Param state query string true "状态参数"
// @Router /auth/callback/feishu [get]
func FeishuCallback(c *gin.Context) {
	code := c.Query("code")
	state := c.Query("state")

	if code == "" {
		c.JSON(400, gin.H{"error": "Missing authorization code"})
		return
	}

	// 使用飞书OAuth服务处理回调
	userInfo, err := svcauth.HandleFeishuCallback(code, state)
	if err != nil {
		c.JSON(500, gin.H{
			"error": "Failed to handle Feishu callback",
			"message": err.Error(),
		})
		return
	}

	// 查找或创建用户
	var user models.User
	err = models.DB.Where("email = ?", userInfo.Email).First(&user).Error
	if err != nil {
		// 创建新用户
		user = models.User{
			ID:           uuid.New(),
			Email:        userInfo.Email,
			Username:     userInfo.Username,
			Name:         userInfo.Name,
			PasswordHash: "", // OAuth用户没有密码
			Role:         models.RoleUser,
			IsActive:     true,
		}
		if err := models.DB.Create(&user).Error; err != nil {
			c.JSON(500, gin.H{"error": "Failed to create user"})
			return
		}
	} else {
		// 如果用户已存在但没有名称，更新名称
		if user.Name == "" && userInfo.Name != "" {
			user.Name = userInfo.Name
			models.DB.Save(&user)
		}
		if user.Username == "" && userInfo.Username != "" {
			user.Username = userInfo.Username
			models.DB.Save(&user)
		}
	}

	// 生成JWT token
	token, err := lib.GenerateToken(user.ID, user.Email, string(user.Role))
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to generate token"})
		return
	}

	// 清除敏感信息
	user.PasswordHash = ""

	c.JSON(200, LoginResponse{
		Token: token,
		User:  user,
	})
}

// XiaohongshuCallback 小红书回调
// @Summary 小红书OAuth回调
// @Description 小红书OAuth登录回调
// @Tags auth
// @Accept json
// @Produce json
// @Param code query string true "OAuth授权码"
// @Param state query string true "状态参数"
// @Router /auth/callback/xiaohongshu [get]
func XiaohongshuCallback(c *gin.Context) {
	code := c.Query("code")
	state := c.Query("state")

	if code == "" {
		c.JSON(400, gin.H{"error": "Missing authorization code"})
		return
	}

	// 使用小红书OAuth服务处理回调
	userInfo, err := svcauth.HandleXiaohongshuCallback(code, state)
	if err != nil {
		c.JSON(500, gin.H{
			"error": "Failed to handle Xiaohongshu callback",
			"message": err.Error(),
		})
		return
	}

	// 查找或创建用户
	var user models.User
	err = models.DB.Where("email = ?", userInfo.Email).First(&user).Error
	if err != nil {
		// 创建新用户
		user = models.User{
			ID:           uuid.New(),
			Email:        userInfo.Email,
			Username:     userInfo.Username,
			Name:         userInfo.Name,
			PasswordHash: "", // OAuth用户没有密码
			Role:         models.RoleUser,
			IsActive:     true,
		}
		if err := models.DB.Create(&user).Error; err != nil {
			c.JSON(500, gin.H{"error": "Failed to create user"})
			return
		}
	} else {
		// 如果用户已存在但没有名称，更新名称
		if user.Name == "" && userInfo.Name != "" {
			user.Name = userInfo.Name
			models.DB.Save(&user)
		}
		if user.Username == "" && userInfo.Username != "" {
			user.Username = userInfo.Username
			models.DB.Save(&user)
		}
	}

	// 生成JWT token
	token, err := lib.GenerateToken(user.ID, user.Email, string(user.Role))
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to generate token"})
		return
	}

	// 清除敏感信息
	user.PasswordHash = ""

	c.JSON(200, LoginResponse{
		Token: token,
		User:  user,
	})
}

// UpdateProfileRequest 更新用户信息请求
type UpdateProfileRequest struct {
	Name      string `json:"name"`
	Username  string `json:"username"`
	Bio       string `json:"bio"`
	AvatarURL string `json:"avatar_url"`
	Timezone  string `json:"timezone"`
	Location  string `json:"location"`
	Website   string `json:"website"`
	GitHub    string `json:"github"`
	Twitter   string `json:"twitter"`
	LinkedIn  string `json:"linkedin"`
}

// UpdateProfile 更新用户个人信息
// @Summary 更新用户个人信息
// @Description 更新当前登录用户的个人信息
// @Tags auth
// @Accept json
// @Produce json
// @Security Bearer
// @Param request body UpdateProfileRequest true "用户信息"
// @Success 200 {object} models.User
// @Router /auth/profile [put]
func UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := models.GetDB()

	// 更新用户基本信息
	var user models.User
	if err := db.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// 更新字段
	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Username != "" {
		// 检查用户名是否已被其他用户使用
		var existingUser models.User
		if err := db.Where("username = ? AND id != ?", req.Username, userID).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Username already taken"})
			return
		}
		updates["username"] = req.Username
	}

	if len(updates) > 0 {
		if err := db.Model(&user).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
			return
		}
	}

	// 更新或创建用户档案
	var profile models.UserProfile
	if err := db.Where("user_id = ?", userID).First(&profile).Error; err != nil {
		// 创建新档案
		profile = models.UserProfile{
			ID:     uuid.New(),
			UserID: userID.(uuid.UUID),
		}
	}

	// 更新档案字段
	profileUpdates := make(map[string]interface{})
	if req.Bio != "" {
		profileUpdates["bio"] = req.Bio
	}
	if req.AvatarURL != "" {
		profileUpdates["avatar_url"] = req.AvatarURL
	}
	if req.Timezone != "" || req.Location != "" || req.Website != "" || req.GitHub != "" || req.Twitter != "" || req.LinkedIn != "" {
		// 更新偏好设置（JSON格式）
		preferences := make(map[string]interface{})
		if req.Timezone != "" {
			preferences["timezone"] = req.Timezone
		}
		if req.Location != "" {
			preferences["location"] = req.Location
		}
		if req.Website != "" {
			preferences["website"] = req.Website
		}
		if req.GitHub != "" {
			preferences["github"] = req.GitHub
		}
		if req.Twitter != "" {
			preferences["twitter"] = req.Twitter
		}
		if req.LinkedIn != "" {
			preferences["linkedin"] = req.LinkedIn
		}
		profileUpdates["preferences"] = preferences
	}

	if len(profileUpdates) > 0 {
		if err := db.Model(&profile).Updates(profileUpdates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
			return
		}
	}

	// 重新加载用户数据
	db.Preload("Profile").First(&user, "id = ?", userID)
	user.PasswordHash = ""

	c.JSON(http.StatusOK, user)
}






// OAuthAccount 第三方账号信息
type OAuthAccount struct {
	Provider       string    `json:"provider"`
	ProviderUserID string    `json:"provider_user_id"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// GetOAuthAccounts 获取用户绑定的第三方账号
// @Summary 获取第三方账号
// @Description 获取当前用户绑定的第三方账号列表
// @Tags auth
// @Accept json
// @Produce json
// @Security Bearer
// @Success 200 {array} OAuthAccount
// @Router /auth/oauth-accounts [get]
func GetOAuthAccounts(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	db := models.GetDB()

	var oauthProviders []models.OAuthProvider
	if err := db.Where("user_id = ?", userID).Find(&oauthProviders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch OAuth accounts"})
		return
	}

	accounts := make([]OAuthAccount, len(oauthProviders))
	for i, provider := range oauthProviders {
		accounts[i] = OAuthAccount{
			Provider:       provider.Provider,
			ProviderUserID: provider.ProviderUserID,
			CreatedAt:      provider.CreatedAt,
			UpdatedAt:      provider.UpdatedAt,
		}
	}

	c.JSON(http.StatusOK, accounts)
}

// UnbindOAuthAccount 解绑第三方账号
// @Summary 解绑第三方账号
// @Description 解绑用户绑定的第三方账号
// @Tags auth
// @Accept json
// @Produce json
// @Security Bearer
// @Param provider path string true "第三方提供商: github, google, wechat, feishu, xiaohongshu"
// @Success 200 {object} map[string]interface{}
// @Router /auth/oauth-accounts/{provider} [delete]
func UnbindOAuthAccount(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	provider := c.Param("provider")
	
	// 验证提供商
	validProviders := map[string]bool{
		"github":       true,
		"google":       true,
		"wechat":       true,
		"feishu":       true,
		"xiaohongshu":  true,
	}

	if !validProviders[provider] {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Unsupported OAuth provider",
			"message": fmt.Sprintf("Provider '%s' is not supported", provider),
		})
		return
	}

	db := models.GetDB()

	// 检查用户是否有密码，如果没有密码且这是唯一的登录方式，则不允许解绑
	var user models.User
	if err := db.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// 统计用户的OAuth账号数量
	var oauthCount int64
	db.Model(&models.OAuthProvider{}).Where("user_id = ?", userID).Count(&oauthCount)

	// 如果用户没有密码且只有一个OAuth账号，则不允许解绑
	if user.PasswordHash == "" && oauthCount <= 1 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Cannot unbind last OAuth account",
			"message": "You must set a password before unbinding your last OAuth account",
		})
		return
	}

	// 删除OAuth账号
	result := db.Where("user_id = ? AND provider = ?", userID, provider).Delete(&models.OAuthProvider{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unbind OAuth account"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "OAuth account not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("%s account unbound successfully", provider),
	})
}

// UpdatePreferencesRequest 更新偏好设置请求
type UpdatePreferencesRequest struct {
	Language    string `json:"language"`
	Theme       string `json:"theme"`
	Notifications struct {
		Email     bool `json:"email"`
		InApp     bool `json:"in_app"`
		Marketing bool `json:"marketing"`
	} `json:"notifications"`
	Privacy struct {
		ProfilePublic bool `json:"profile_public"`
		AnalyticsOptIn bool `json:"analytics_opt_in"`
	} `json:"privacy"`
	Display struct {
		ViewMode     string `json:"view_mode"` // list, grid
		ItemsPerPage int    `json:"items_per_page"`
	} `json:"display"`
	Search struct {
		SaveHistory bool `json:"save_history"`
		Personalized bool `json:"personalized"`
	} `json:"search"`
}

// UpdatePreferences 更新用户偏好设置
// @Summary 更新用户偏好设置
// @Description 更新当前登录用户的偏好设置
// @Tags auth
// @Accept json
// @Produce json
// @Security Bearer
// @Param request body UpdatePreferencesRequest true "偏好设置"
// @Success 200 {object} map[string]interface{}
// @Router /auth/preferences [put]
func UpdatePreferences(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req UpdatePreferencesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := models.GetDB()

	// 查找或创建用户档案
	var profile models.UserProfile
	if err := db.Where("user_id = ?", userID).First(&profile).Error; err != nil {
		// 创建新档案
		profile = models.UserProfile{
			ID:     uuid.New(),
			UserID: userID.(uuid.UUID),
		}
	}

	// 构建偏好设置JSON
	preferences := map[string]interface{}{
		"language": req.Language,
		"theme":    req.Theme,
		"notifications": map[string]bool{
			"email":     req.Notifications.Email,
			"in_app":    req.Notifications.InApp,
			"marketing": req.Notifications.Marketing,
		},
		"privacy": map[string]bool{
			"profile_public":  req.Privacy.ProfilePublic,
			"analytics_opt_in": req.Privacy.AnalyticsOptIn,
		},
		"display": map[string]interface{}{
			"view_mode":      req.Display.ViewMode,
			"items_per_page": req.Display.ItemsPerPage,
		},
		"search": map[string]bool{
			"save_history":  req.Search.SaveHistory,
			"personalized":  req.Search.Personalized,
		},
	}

	// 更新偏好设置
	profile.Preferences = string(jsonMarshal(preferences))
	if err := db.Save(&profile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update preferences"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Preferences updated successfully",
		"preferences": preferences,
	})
}

// GetPreferences 获取用户偏好设置
// @Summary 获取用户偏好设置
// @Description 获取当前登录用户的偏好设置
// @Tags auth
// @Accept json
// @Produce json
// @Security Bearer
// @Success 200 {object} map[string]interface{}
// @Router /auth/preferences [get]
func GetPreferences(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	db := models.GetDB()

	// 查找用户档案
	var profile models.UserProfile
	if err := db.Where("user_id = ?", userID).First(&profile).Error; err != nil {
		// 返回默认偏好设置
		defaultPreferences := map[string]interface{}{
			"language": "zh",
			"theme":    "dark",
			"notifications": map[string]bool{
				"email":     true,
				"in_app":    true,
				"marketing": false,
			},
			"privacy": map[string]bool{
				"profile_public":  true,
				"analytics_opt_in": true,
			},
			"display": map[string]interface{}{
				"view_mode":      "grid",
				"items_per_page": 20,
			},
			"search": map[string]bool{
				"save_history":  true,
				"personalized":  true,
			},
		}
		c.JSON(http.StatusOK, defaultPreferences)
		return
	}

	// 解析偏好设置JSON
	var preferences map[string]interface{}
	if err := json.Unmarshal([]byte(profile.Preferences), &preferences); err != nil {
		// 返回默认偏好设置
		defaultPreferences := map[string]interface{}{
			"language": "zh",
			"theme":    "dark",
			"notifications": map[string]bool{
				"email":     true,
				"in_app":    true,
				"marketing": false,
			},
			"privacy": map[string]bool{
				"profile_public":  true,
				"analytics_opt_in": true,
			},
			"display": map[string]interface{}{
				"view_mode":      "grid",
				"items_per_page": 20,
			},
			"search": map[string]bool{
				"save_history":  true,
				"personalized":  true,
			},
		}
		c.JSON(http.StatusOK, defaultPreferences)
		return
	}

	c.JSON(http.StatusOK, preferences)
}

// 辅助函数：JSON序列化
func jsonMarshal(v interface{}) []byte {
	data, _ := json.Marshal(v)
	return data
}

// ChangePassword 修改密码
// @Summary 修改用户密码
// @Description 修改当前登录用户的密码
// @Tags auth
// @Accept json
// @Produce json
// @Security Bearer
// @Param request body ChangePasswordRequest true "密码信息"
// @Success 200 {object} map[string]interface{}
// @Router /auth/password [put]
func ChangePassword(c *gin.Context) {
	// TODO: 实现修改密码功能
	c.JSON(http.StatusNotImplemented, gin.H{
		"error": "Change password functionality not implemented yet",
	})
}

// ChangePasswordRequest 修改密码请求
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=6"`
}
