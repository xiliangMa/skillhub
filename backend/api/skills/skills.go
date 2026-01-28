package skills

import (
	"github.com/gin-gonic/gin"
)

// ListSkills 列出所有skills
func ListSkills(c *gin.Context) {
	c.JSON(200, gin.H{
		"code":    0,
		"message": "ListSkills endpoint - temporarily disabled",
	})
}

// GetSkill 获取单个skill详情
func GetSkill(c *gin.Context) {
	c.JSON(200, gin.H{
		"code":    0,
		"message": "GetSkill endpoint - temporarily disabled",
	})
}

// GetCategories 获取所有分类
func GetCategories(c *gin.Context) {
	c.JSON(200, gin.H{
		"code":    0,
		"message": "GetCategories endpoint - temporarily disabled",
	})
}

// GetHotSkills 获取热门skills
func GetHotSkills(c *gin.Context) {
	c.JSON(200, gin.H{
		"code":    0,
		"message": "GetHotSkills endpoint - temporarily disabled",
	})
}

// GetTrendingSkills 获取趋势skills
func GetTrendingSkills(c *gin.Context) {
	c.JSON(200, gin.H{
		"code":    0,
		"message": "GetTrendingSkills endpoint - temporarily disabled",
	})
}
