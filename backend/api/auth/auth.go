package auth

import (
	"fmt"
	"net/http"
	"skillhub/lib"
	"skillhub/models"
	svcauth "skillhub/services/auth"

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
			ID:       uuid.New(),
			Email:    userInfo.Email,
			PasswordHash: "", // OAuth用户没有密码
			Role:     models.RoleUser,
			IsActive: true,
		}
		if err := models.DB.Create(&user).Error; err != nil {
			c.JSON(500, gin.H{"error": "Failed to create user"})
			return
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
			ID:       uuid.New(),
			Email:    userInfo.Email,
			PasswordHash: "", // OAuth用户没有密码
			Role:     models.RoleUser,
			IsActive: true,
		}
		if err := models.DB.Create(&user).Error; err != nil {
			c.JSON(500, gin.H{"error": "Failed to create user"})
			return
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
			ID:       uuid.New(),
			Email:    userInfo.Email,
			PasswordHash: "", // OAuth用户没有密码
			Role:     models.RoleUser,
			IsActive: true,
		}
		if err := models.DB.Create(&user).Error; err != nil {
			c.JSON(500, gin.H{"error": "Failed to create user"})
			return
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
