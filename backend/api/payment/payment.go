package payment

import (
	"github.com/gin-gonic/gin"
)

// CreateOrder 创建订单
func CreateOrder(c *gin.Context) {
	c.JSON(200, gin.H{
		"code":    200,
		"message": "CreateOrder endpoint - temporarily disabled",
	})
}

// GetPaymentURL 获取支付链接
func GetPaymentURL(c *gin.Context) {
	c.JSON(200, gin.H{
		"code":    200,
		"message": "GetPaymentURL endpoint - temporarily disabled",
	})
}

// AlipayCallback 支付宝回调
func AlipayCallback(c *gin.Context) {
	c.JSON(200, gin.H{"message": "AlipayCallback endpoint - temporarily disabled"})
}

// GetOrders 获取用户订单列表
func GetOrders(c *gin.Context) {
	c.JSON(200, gin.H{
		"code":    0,
		"message": "GetOrders endpoint - temporarily disabled",
	})
}
