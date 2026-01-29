package mock

import (
	"log"
	"skillhub/models"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SeedData 初始化mock数据
func SeedData() error {
	db := models.GetDB()

	// 检查是否已有数据
	var count int64
	db.Model(&models.Skill{}).Count(&count)
	if count > 0 {
		log.Println("Database already seeded, skipping...")
		return nil
	}

	log.Println("Starting database seed...")
	log.Println("Force reseeding database...")

	// 创建分类
	categories := createMockCategories(db)
	if len(categories) == 0 {
		log.Println("Warning: No categories created")
	}

	// 创建技能
	skills := createMockSkills(db, categories)
	log.Printf("Created %d mock skills", len(skills))

	// 创建用户
	users := createMockUsers(db)
	log.Printf("Created %d mock users", len(users))

	// 创建订单和交易
	createMockOrders(db, users, skills)
	log.Printf("Created mock orders and transactions")

	return nil
}

func createMockCategories(db *gorm.DB) []models.SkillCategory {
	categories := []models.SkillCategory{
		{Name: "AI助手", SortOrder: 1},
		{Name: "数据处理", SortOrder: 2},
		{Name: "自动化", SortOrder: 3},
		{Name: "开发工具", SortOrder: 4},
		{Name: "业务应用", SortOrder: 5},
	}

	if err := db.Create(&categories).Error; err != nil {
		log.Printf("Error creating categories: %v", err)
		return nil
	}
	return categories
}

func createMockSkills(db *gorm.DB, categories []models.SkillCategory) []models.Skill {
	if len(categories) == 0 {
		return nil
	}

	now := time.Now()
	skills := []models.Skill{
		{
			Name:        "Claude代码分析助手",
			Description: "基于Claude AI的智能代码分析和审查工具，支持多种编程语言",
			GitHubURL:   "https://github.com/example/claude-analyzer",
			CategoryID:  &categories[0].ID,
			PriceType:   models.PriceTypePaid,
			Price:       99.00,
			DownloadsCount: 1520,
			PurchasesCount: 320,
			Rating:      4.8,
			StarsCount:  1200,
			ForksCount:  340,
			IsActive:    true,
			LastSyncAt:  &now,
		},
		{
			Name:        "GPT4文档生成器",
			Description: "自动生成API文档、技术文档和用户手册的智能工具",
			GitHubURL:   "https://github.com/example/gpt4-docgen",
			CategoryID:  &categories[0].ID,
			PriceType:   models.PriceTypePaid,
			Price:       149.00,
			DownloadsCount: 890,
			PurchasesCount: 180,
			Rating:      4.9,
			StarsCount:  850,
			ForksCount:  210,
			IsActive:    true,
			LastSyncAt:  &now,
		},
		{
			Name:        "数据清洗大师",
			Description: "智能数据清洗和预处理工具，支持CSV、Excel、JSON等多种格式",
			GitHubURL:   "https://github.com/example/data-cleaner",
			CategoryID:  &categories[1].ID,
			PriceType:   models.PriceTypeFree,
			Price:       0.00,
			DownloadsCount: 3200,
			PurchasesCount: 0,
			Rating:      4.5,
			StarsCount: 2100,
			ForksCount:  560,
			IsActive:    true,
			LastSyncAt:  &now,
		},
		{
			Name:        "Excel自动报表",
			Description: "自动生成Excel报表和图表的工具，支持定时任务",
			GitHubURL:   "https://github.com/example/excel-auto",
			CategoryID:  &categories[2].ID,
			PriceType:   models.PriceTypePaid,
			Price:       79.00,
			DownloadsCount: 1100,
			PurchasesCount: 240,
			Rating:      4.7,
			StarsCount: 980,
			ForksCount:  270,
			IsActive:    true,
			LastSyncAt:  &now,
		},
		{
			Name:        "代码质量检测",
			Description: "全面的代码质量检查工具，支持安全漏洞扫描和性能分析",
			GitHubURL:   "https://github.com/example/code-quality",
			CategoryID:  &categories[3].ID,
			PriceType:   models.PriceTypeFree,
			Price:       0.00,
			DownloadsCount: 2800,
			PurchasesCount: 0,
			Rating:      4.6,
			StarsCount: 1900,
			ForksCount:  480,
			IsActive:    true,
			LastSyncAt:  &now,
		},
		{
			Name:        "客服机器人",
			Description: "智能客服机器人，支持多轮对话和知识库管理",
			GitHubURL:   "https://github.com/example/support-bot",
			CategoryID:  &categories[4].ID,
			PriceType:   models.PriceTypePaid,
			Price:       199.00,
			DownloadsCount: 650,
			PurchasesCount: 140,
			Rating:      4.9,
			StarsCount: 720,
			ForksCount:  190,
			IsActive:    true,
			LastSyncAt:  &now,
		},
		{
			Name:        "图像识别助手",
			Description: "基于深度学习的图像识别和分类工具",
			GitHubURL:   "https://github.com/example/image-recognition",
			CategoryID:  &categories[0].ID,
			PriceType:   models.PriceTypePaid,
			Price:       129.00,
			DownloadsCount: 780,
			PurchasesCount: 165,
			Rating:      4.7,
			StarsCount: 880,
			ForksCount:  230,
			IsActive:    true,
			LastSyncAt:  &now,
		},
		{
			Name:        "SQL优化大师",
			Description: "智能SQL查询优化和索引建议工具",
			GitHubURL:   "https://github.com/example/sql-optimizer",
			CategoryID:  &categories[3].ID,
			PriceType:   models.PriceTypeFree,
			Price:       0.00,
			DownloadsCount: 1950,
			PurchasesCount: 0,
			Rating:      4.8,
			StarsCount: 1650,
			ForksCount:  420,
			IsActive:    true,
			LastSyncAt:  &now,
		},
		{
			Name:        "工作流自动化",
			Description: "可视化工作流自动化工具，支持多种触发器和动作",
			GitHubURL:   "https://github.com/example/workflow-automation",
			CategoryID:  &categories[2].ID,
			PriceType:   models.PriceTypePaid,
			Price:       179.00,
			DownloadsCount: 520,
			PurchasesCount: 110,
			Rating:      4.6,
			StarsCount: 580,
			ForksCount:  150,
			IsActive:    true,
			LastSyncAt:  &now,
		},
		{
			Name:        "日志分析工具",
			Description: "智能日志分析和异常检测工具",
			GitHubURL:   "https://github.com/example/log-analyzer",
			CategoryID:  &categories[3].ID,
			PriceType:   models.PriceTypeFree,
			Price:       0.00,
			DownloadsCount: 2400,
			PurchasesCount: 0,
			Rating:      4.5,
			StarsCount: 1800,
			ForksCount:  460,
			IsActive:    true,
			LastSyncAt:  &now,
		},
		{
			Name:        "邮件自动回复",
			Description: "智能邮件分类和自动回复系统",
			GitHubURL:   "https://github.com/example/email-autoresponder",
			CategoryID:  &categories[4].ID,
			PriceType:   models.PriceTypePaid,
			Price:       89.00,
			DownloadsCount: 920,
			PurchasesCount: 195,
			Rating:      4.8,
			StarsCount: 1020,
			ForksCount:  280,
			IsActive:    true,
			LastSyncAt:  &now,
		},
		{
			Name:        "文本摘要生成器",
			Description: "基于AI的长文本自动摘要和关键信息提取工具",
			GitHubURL:   "https://github.com/example/text-summarizer",
			CategoryID:  &categories[0].ID,
			PriceType:   models.PriceTypeFree,
			Price:       0.00,
			DownloadsCount: 3100,
			PurchasesCount: 0,
			Rating:      4.7,
			StarsCount: 2200,
			ForksCount:  580,
			IsActive:    true,
			LastSyncAt:  &now,
		},
	}

	if err := db.Create(&skills).Error; err != nil {
		log.Printf("Error creating skills: %v", err)
		return nil
	}
	return skills
}

func createMockUsers(db *gorm.DB) []models.User {
	users := []models.User{
		{
			Email:        "admin@skillhub.com",
			PasswordHash: "$2a$10$TpgcnE4sZOjoTmlXrXPjoeRBN.maoV0DBudKLVi2HjD2FD41rO9LC", // password: admin123
			Role:         models.RoleAdmin,
			IsActive:     true,
		},
		{
			Email:        "user@example.com",
			PasswordHash: "$2a$10$TpgcnE4sZOjoTmlXrXPjoeRBN.maoV0DBudKLVi2HjD2FD41rO9LC", // password: admin123
			Role:         models.RoleUser,
			IsActive:     true,
		},
		{
			Email:        "test@example.com",
			PasswordHash: "$2a$10$TpgcnE4sZOjoTmlXrXPjoeRBN.maoV0DBudKLVi2HjD2FD41rO9LC", // password: admin123
			Role:         models.RoleUser,
			IsActive:     true,
		},
	}

	if err := db.Create(&users).Error; err != nil {
		log.Printf("Error creating users: %v", err)
		return nil
	}
	return users
}

func createMockOrders(db *gorm.DB, users []models.User, skills []models.Skill) {
	if len(users) == 0 || len(skills) == 0 {
		return
	}

	var paidSkills []models.Skill
	for _, skill := range skills {
		if skill.PriceType == models.PriceTypePaid {
			paidSkills = append(paidSkills, skill)
		}
	}

	if len(paidSkills) == 0 {
		return
	}

	now := time.Now()
	yesterday := now.Add(-24 * time.Hour)
	
	// 创建订单
	orders := []models.Order{
		{
			OrderNo:       "ORD" + uuid.New().String()[:8],
			UserID:        users[1].ID,
			TotalAmount:   99.00,
			PaymentMethod: "alipay",
			Status:        models.OrderStatusPaid,
			CreatedAt:     yesterday,
			PaidAt:        &yesterday,
		},
		{
			OrderNo:       "ORD" + uuid.New().String()[:8],
			UserID:        users[1].ID,
			TotalAmount:   248.00,
			PaymentMethod: "alipay",
			Status:        models.OrderStatusPaid,
			CreatedAt:     now.Add(-12 * time.Hour),
			PaidAt:        &now,
		},
		{
			OrderNo:       "ORD" + uuid.New().String()[:8],
			UserID:        users[2].ID,
			TotalAmount:   149.00,
			PaymentMethod: "alipay",
			Status:        models.OrderStatusPaid,
			CreatedAt:     now.Add(-6 * time.Hour),
			PaidAt:        &now,
		},
		{
			OrderNo:       "ORD" + uuid.New().String()[:8],
			UserID:        users[1].ID,
			TotalAmount:   199.00,
			PaymentMethod: "wechat",
			Status:        models.OrderStatusPending,
			CreatedAt:     now,
		},
	}

	if err := db.Create(&orders).Error; err != nil {
		log.Printf("Error creating orders: %v", err)
		return
	}

	// 创建订单项
	orderItems := []models.OrderItem{
		{OrderID: orders[0].ID, SkillID: &paidSkills[0].ID, Price: 99.00, Quantity: 1},
		{OrderID: orders[1].ID, SkillID: &paidSkills[0].ID, Price: 99.00, Quantity: 1},
		{OrderID: orders[1].ID, SkillID: &paidSkills[1].ID, Price: 149.00, Quantity: 1},
		{OrderID: orders[2].ID, SkillID: &paidSkills[1].ID, Price: 149.00, Quantity: 1},
		{OrderID: orders[3].ID, SkillID: &paidSkills[5].ID, Price: 199.00, Quantity: 1},
	}

	if err := db.Create(&orderItems).Error; err != nil {
		log.Printf("Error creating order items: %v", err)
	}

	// 创建交易记录
	transactions := []models.Transaction{
		{
			OrderID:        orders[0].ID,
			PaymentChannel: "alipay",
			TransactionID:  "ALI" + uuid.New().String()[:8],
			Amount:         99.00,
			Status:         models.TransactionStatusSuccess,
			CreatedAt:      yesterday,
		},
		{
			OrderID:        orders[1].ID,
			PaymentChannel: "alipay",
			TransactionID:  "ALI" + uuid.New().String()[:8],
			Amount:         248.00,
			Status:         models.TransactionStatusSuccess,
			CreatedAt:      now.Add(-12 * time.Hour),
		},
		{
			OrderID:        orders[2].ID,
			PaymentChannel: "alipay",
			TransactionID:  "ALI" + uuid.New().String()[:8],
			Amount:         149.00,
			Status:         models.TransactionStatusSuccess,
			CreatedAt:      now.Add(-6 * time.Hour),
		},
	}

	if err := db.Create(&transactions).Error; err != nil {
		log.Printf("Error creating transactions: %v", err)
	}
}
