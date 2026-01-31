package analytics

import (
	"context"
	"fmt"
	"skillhub/config"
	"skillhub/models"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AnalyticsService 分析服务接口
type AnalyticsService interface {
	// 数据跟踪
	TrackView(skillID uuid.UUID) error
	TrackDownload(skillID uuid.UUID, userID uuid.UUID) error
	TrackPurchase(skillID uuid.UUID, userID uuid.UUID, amount float64) error

	// 平台统计
	GetPlatformStats(ctx context.Context) (*PlatformStats, error)
	GetDailyStats(ctx context.Context, date time.Time) (*DailyStats, error)
	GetRevenueStats(ctx context.Context, startDate, endDate time.Time) (*RevenueStats, error)

	// 技能分析
	GetSkillAnalytics(ctx context.Context, skillID uuid.UUID, days int) (*SkillAnalyticsData, error)
	GetTopSkills(ctx context.Context, limit int, period string) ([]*SkillRanking, error)
	GetCategoryStats(ctx context.Context) ([]*CategoryStats, error)

	// 用户分析
	GetUserActivity(ctx context.Context, userID uuid.UUID, days int) (*UserActivity, error)
	GetUserRankings(ctx context.Context, limit int) ([]*UserRanking, error)

	// 报告生成
	GenerateReport(ctx context.Context, reportType string, startDate, endDate time.Time) (*Report, error)
}

// PlatformStats 平台统计数据
type PlatformStats struct {
	TotalUsers      int64   `json:"total_users"`
	TotalSkills     int64   `json:"total_skills"`
	ActiveSkills    int64   `json:"active_skills"`
	PaidSkills      int64   `json:"paid_skills"`
	FreeSkills      int64   `json:"free_skills"`
	TotalOrders     int64   `json:"total_orders"`
	TotalRevenue    float64 `json:"total_revenue"`
	TodayOrders     int64   `json:"today_orders"`
	TodayRevenue    float64 `json:"today_revenue"`
	PendingOrders   int64   `json:"pending_orders"`
	RecentOrders    []Order `json:"recent_orders"`
}

// DailyStats 每日统计数据
type DailyStats struct {
	Date           time.Time `json:"date"`
	NewUsers       int64     `json:"new_users"`
	NewSkills      int64     `json:"new_skills"`
	TotalViews     int64     `json:"total_views"`
	TotalDownloads int64     `json:"total_downloads"`
	TotalPurchases int64     `json:"total_purchases"`
	TotalRevenue   float64   `json:"total_revenue"`
}

// RevenueStats 收入统计数据
type RevenueStats struct {
	Period       string           `json:"period"`
	TotalRevenue float64          `json:"total_revenue"`
	DailyRevenue []DailyRevenue   `json:"daily_revenue"`
	ByCategory   []CategoryRevenue `json:"by_category"`
	ByPayment    []PaymentRevenue `json:"by_payment"`
}

// SkillAnalyticsData 技能分析数据
type SkillAnalyticsData struct {
	SkillID        uuid.UUID       `json:"skill_id"`
	SkillName      string          `json:"skill_name"`
	TotalViews     int64           `json:"total_views"`
	TotalDownloads int64           `json:"total_downloads"`
	TotalPurchases int64           `json:"total_purchases"`
	TotalRevenue   float64         `json:"total_revenue"`
	DailyTrends    []SkillDailyTrend `json:"daily_trends"`
	Rating         float64         `json:"rating"`
	Rank           int             `json:"rank"`
}

// SkillRanking 技能排名
type SkillRanking struct {
	SkillID        uuid.UUID `json:"skill_id"`
	SkillName      string    `json:"skill_name"`
	Category       string    `json:"category"`
	Views          int64     `json:"views"`
	Downloads      int64     `json:"downloads"`
	Purchases      int64     `json:"purchases"`
	Revenue        float64   `json:"revenue"`
	GrowthRate     float64   `json:"growth_rate"`
}

// CategoryStats 分类统计
type CategoryStats struct {
	CategoryID   uuid.UUID `json:"category_id"`
	CategoryName string    `json:"category_name"`
	SkillCount   int64     `json:"skill_count"`
	TotalViews   int64     `json:"total_views"`
	TotalRevenue float64   `json:"total_revenue"`
	AvgRating    float64   `json:"avg_rating"`
}

// UserActivity 用户活动
type UserActivity struct {
	UserID          uuid.UUID `json:"user_id"`
	TotalPurchases  int64     `json:"total_purchases"`
	TotalSpent      float64   `json:"total_spent"`
	LastActive      time.Time `json:"last_active"`
	FavoriteCategory string   `json:"favorite_category"`
	RecentSkills    []string  `json:"recent_skills"`
}

// UserRanking 用户排名
type UserRanking struct {
	UserID     uuid.UUID `json:"user_id"`
	Email      string    `json:"email"`
	TotalSpent float64   `json:"total_spent"`
	SkillCount int64     `json:"skill_count"`
	Rank       int       `json:"rank"`
}

// Report 分析报告
type Report struct {
	ReportID   string    `json:"report_id"`
	ReportType string    `json:"report_type"`
	Period     string    `json:"period"`
	Data       interface{} `json:"data"`
	GeneratedAt time.Time `json:"generated_at"`
}

// Order 订单信息（用于统计）
type Order struct {
	ID          string    `json:"id"`
	OrderNo     string    `json:"order_no"`
	UserEmail   string    `json:"user_email"`
	TotalAmount float64   `json:"total_amount"`
	Status      string    `json:"status"`
	CreatedAt   string    `json:"created_at"`
}

// DailyRevenue 每日收入
type DailyRevenue struct {
	Date   time.Time `json:"date"`
	Amount float64   `json:"amount"`
}

// CategoryRevenue 分类收入
type CategoryRevenue struct {
	Category string  `json:"category"`
	Amount   float64 `json:"amount"`
	Percentage float64 `json:"percentage"`
}

// PaymentRevenue 支付渠道收入
type PaymentRevenue struct {
	PaymentMethod string  `json:"payment_method"`
	Amount        float64 `json:"amount"`
	Percentage    float64 `json:"percentage"`
}

// SkillDailyTrend 技能每日趋势
type SkillDailyTrend struct {
	Date     time.Time `json:"date"`
	Views    int64     `json:"views"`
	Downloads int64    `json:"downloads"`
	Purchases int64    `json:"purchases"`
	Revenue  float64   `json:"revenue"`
}

// AnalyticsServiceImpl 分析服务实现
type AnalyticsServiceImpl struct {
	db    *gorm.DB
	config *config.Config
}

// NewAnalyticsService 创建分析服务实例
func NewAnalyticsService(db *gorm.DB, cfg *config.Config) AnalyticsService {
	return &AnalyticsServiceImpl{
		db:    db,
		config: cfg,
	}
}

// TrackView 跟踪技能浏览
func (s *AnalyticsServiceImpl) TrackView(skillID uuid.UUID) error {
	// 使用upsert逻辑：如果当天记录存在则增加计数，否则创建新记录
	return s.db.Exec(`
		INSERT INTO skill_analytics (id, skill_id, date, views_count, downloads_count, purchases_count, created_at)
		VALUES (uuid_generate_v4(), ?, ?, 1, 0, 0, NOW())
		ON CONFLICT (skill_id, date)
		DO UPDATE SET views_count = skill_analytics.views_count + 1, updated_at = NOW()
	`, skillID, time.Now().Format("2006-01-02")).Error
}

// TrackDownload 跟踪技能下载
func (s *AnalyticsServiceImpl) TrackDownload(skillID uuid.UUID, userID uuid.UUID) error {
	// 记录下载到数据库
	return s.db.Exec(`
		INSERT INTO skill_analytics (id, skill_id, date, views_count, downloads_count, purchases_count, created_at)
		VALUES (uuid_generate_v4(), ?, ?, 0, 1, 0, NOW())
		ON CONFLICT (skill_id, date)
		DO UPDATE SET downloads_count = skill_analytics.downloads_count + 1, updated_at = NOW()
	`, skillID, time.Now().Format("2006-01-02")).Error
}

// TrackPurchase 跟踪技能购买
func (s *AnalyticsServiceImpl) TrackPurchase(skillID uuid.UUID, userID uuid.UUID, amount float64) error {
	// 记录购买到数据库
	return s.db.Exec(`
		INSERT INTO skill_analytics (id, skill_id, date, views_count, downloads_count, purchases_count, created_at)
		VALUES (uuid_generate_v4(), ?, ?, 0, 0, 1, NOW())
		ON CONFLICT (skill_id, date)
		DO UPDATE SET purchases_count = skill_analytics.purchases_count + 1, updated_at = NOW()
	`, skillID, time.Now().Format("2006-01-02")).Error
}

// GetPlatformStats 获取平台统计
func (s *AnalyticsServiceImpl) GetPlatformStats(ctx context.Context) (*PlatformStats, error) {
	var stats PlatformStats

	// 用户统计
	s.db.Model(&models.User{}).Count(&stats.TotalUsers)

	// 技能统计
	s.db.Model(&models.Skill{}).Count(&stats.TotalSkills)
	s.db.Model(&models.Skill{}).Where("is_active = ?", true).Count(&stats.ActiveSkills)
	s.db.Model(&models.Skill{}).Where("price_type = ?", "paid").Count(&stats.PaidSkills)
	s.db.Model(&models.Skill{}).Where("price_type = ?", "free").Count(&stats.FreeSkills)

	// 订单统计
	s.db.Model(&models.Order{}).Count(&stats.TotalOrders)
	s.db.Model(&models.Order{}).Where("status = ?", "pending").Count(&stats.PendingOrders)

	// 收入统计
	s.db.Model(&models.Order{}).Select("COALESCE(SUM(total_amount), 0)").Scan(&stats.TotalRevenue)

	// 今日统计
	today := time.Now().Format("2006-01-02")
	s.db.Model(&models.Order{}).Where("DATE(created_at) = ?", today).Count(&stats.TodayOrders)
	s.db.Model(&models.Order{}).Where("DATE(created_at) = ?", today).
		Select("COALESCE(SUM(total_amount), 0)").Scan(&stats.TodayRevenue)

	// 最近订单
	var recentOrders []models.Order
	s.db.Model(&models.Order{}).
		Preload("User").
		Order("created_at DESC").
		Limit(10).
		Find(&recentOrders)

	// 转换为API响应格式
	for _, order := range recentOrders {
		stats.RecentOrders = append(stats.RecentOrders, Order{
			ID:          order.ID.String(),
			OrderNo:     order.OrderNo,
			UserEmail:   order.User.Email,
			TotalAmount: order.TotalAmount,
			Status:      string(order.Status),
			CreatedAt:   order.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	return &stats, nil
}

// GetDailyStats 获取每日统计
func (s *AnalyticsServiceImpl) GetDailyStats(ctx context.Context, date time.Time) (*DailyStats, error) {
	var stats DailyStats
	stats.Date = date

	dateStr := date.Format("2006-01-02")

	// 新用户
	s.db.Model(&models.User{}).Where("DATE(created_at) = ?", dateStr).Count(&stats.NewUsers)

	// 新技能
	s.db.Model(&models.Skill{}).Where("DATE(created_at) = ?", dateStr).Count(&stats.NewSkills)

	// 技能分析数据
	var skillAnalytics []models.SkillAnalytics
	s.db.Model(&models.SkillAnalytics{}).Where("date = ?", dateStr).Find(&skillAnalytics)

	for _, sa := range skillAnalytics {
		stats.TotalViews += int64(sa.ViewsCount)
		stats.TotalDownloads += int64(sa.DownloadsCount)
		stats.TotalPurchases += int64(sa.PurchasesCount)
	}

	// 当日收入
	s.db.Model(&models.Order{}).
		Where("DATE(created_at) = ? AND status = ?", dateStr, "paid").
		Select("COALESCE(SUM(total_amount), 0)").
		Scan(&stats.TotalRevenue)

	return &stats, nil
}

// GetRevenueStats 获取收入统计（基础实现）
func (s *AnalyticsServiceImpl) GetRevenueStats(ctx context.Context, startDate, endDate time.Time) (*RevenueStats, error) {
	stats := &RevenueStats{
		Period: fmt.Sprintf("%s to %s", startDate.Format("2006-01-02"), endDate.Format("2006-01-02")),
	}

	// 总收入
	s.db.Model(&models.Order{}).
		Where("created_at BETWEEN ? AND ? AND status = ?", startDate, endDate, "paid").
		Select("COALESCE(SUM(total_amount), 0)").
		Scan(&stats.TotalRevenue)

	return stats, nil
}

// GetSkillAnalytics 获取技能分析（基础实现）
func (s *AnalyticsServiceImpl) GetSkillAnalytics(ctx context.Context, skillID uuid.UUID, days int) (*SkillAnalyticsData, error) {
	var skill models.Skill
	if err := s.db.First(&skill, "id = ?", skillID).Error; err != nil {
		return nil, err
	}

	data := &SkillAnalyticsData{
		SkillID:   skillID,
		SkillName: skill.Name,
	}

	// 获取总统计数据
	var skillAnalytics []models.SkillAnalytics
	s.db.Model(&models.SkillAnalytics{}).Where("skill_id = ?", skillID).Find(&skillAnalytics)

	for _, sa := range skillAnalytics {
		data.TotalViews += int64(sa.ViewsCount)
		data.TotalDownloads += int64(sa.DownloadsCount)
		data.TotalPurchases += int64(sa.PurchasesCount)
	}

	// 获取收入（从订单）
	var totalRevenue float64
	s.db.Model(&models.OrderItem{}).
		Joins("JOIN orders ON order_items.order_id = orders.id").
		Where("order_items.skill_id = ? AND orders.status = ?", skillID, "paid").
		Select("COALESCE(SUM(order_items.price * order_items.quantity), 0)").
		Scan(&totalRevenue)
	data.TotalRevenue = totalRevenue

	data.Rating = skill.Rating

	return data, nil
}

// GetTopSkills 获取热门技能（基础实现）
func (s *AnalyticsServiceImpl) GetTopSkills(ctx context.Context, limit int, period string) ([]*SkillRanking, error) {
	var skills []models.Skill
	s.db.Model(&models.Skill{}).
		Where("is_active = ?", true).
		Order("downloads_count DESC").
		Limit(limit).
		Find(&skills)

	var rankings []*SkillRanking
	for _, skill := range skills {
		rankings = append(rankings, &SkillRanking{
			SkillID:   skill.ID,
			SkillName: skill.Name,
			Category:  "", // 需要加载分类
			Views:     int64(skill.DownloadsCount), // 暂时使用下载量作为视图
			Downloads: int64(skill.DownloadsCount),
			Purchases: int64(skill.PurchasesCount),
			Revenue:   skill.Price * float64(skill.PurchasesCount),
		})
	}

	return rankings, nil
}

// GetCategoryStats 获取分类统计（基础实现）
func (s *AnalyticsServiceImpl) GetCategoryStats(ctx context.Context) ([]*CategoryStats, error) {
	var categories []models.SkillCategory
	s.db.Model(&models.SkillCategory{}).Find(&categories)

	var stats []*CategoryStats
	for _, category := range categories {
		var skillCount int64
		s.db.Model(&models.Skill{}).Where("category_id = ?", category.ID).Count(&skillCount)

		stat := &CategoryStats{
			CategoryID:   category.ID,
			CategoryName: category.Name,
			SkillCount:   skillCount,
		}
		stats = append(stats, stat)
	}

	return stats, nil
}

// GetUserActivity 获取用户活动（基础实现）
func (s *AnalyticsServiceImpl) GetUserActivity(ctx context.Context, userID uuid.UUID, days int) (*UserActivity, error) {
	activity := &UserActivity{
		UserID: userID,
	}

	// 购买统计
	var orders []models.Order
	s.db.Model(&models.Order{}).
		Where("user_id = ? AND status = ?", userID, "paid").
		Find(&orders)

	activity.TotalPurchases = int64(len(orders))
	for _, order := range orders {
		activity.TotalSpent += order.TotalAmount
	}

	// 最后活动时间
	var lastOrder models.Order
	s.db.Model(&models.Order{}).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		First(&lastOrder)
	if lastOrder.ID != uuid.Nil {
		activity.LastActive = lastOrder.CreatedAt
	}

	return activity, nil
}

// GetUserRankings 获取用户排名（基础实现）
func (s *AnalyticsServiceImpl) GetUserRankings(ctx context.Context, limit int) ([]*UserRanking, error) {
	// 简单实现：按购买金额排名
	var users []models.User
	s.db.Model(&models.User{}).
		Joins("LEFT JOIN orders ON users.id = orders.user_id AND orders.status = 'paid'").
		Select("users.*, COALESCE(SUM(orders.total_amount), 0) as total_spent").
		Group("users.id").
		Order("total_spent DESC").
		Limit(limit).
		Find(&users)

	var rankings []*UserRanking
	for i, user := range users {
		var skillCount int64
		s.db.Model(&models.OrderItem{}).
			Joins("JOIN orders ON order_items.order_id = orders.id").
			Where("orders.user_id = ? AND orders.status = ?", user.ID, "paid").
			Count(&skillCount)

		var totalSpent float64
		s.db.Model(&models.Order{}).
			Where("user_id = ? AND status = ?", user.ID, "paid").
			Select("COALESCE(SUM(total_amount), 0)").
			Scan(&totalSpent)

		rankings = append(rankings, &UserRanking{
			UserID:     user.ID,
			Email:      user.Email,
			TotalSpent: totalSpent,
			SkillCount: skillCount,
			Rank:       i + 1,
		})
	}

	return rankings, nil
}

// GenerateReport 生成报告（基础实现）
func (s *AnalyticsServiceImpl) GenerateReport(ctx context.Context, reportType string, startDate, endDate time.Time) (*Report, error) {
	report := &Report{
		ReportID:    uuid.New().String(),
		ReportType:  reportType,
		Period:      fmt.Sprintf("%s to %s", startDate.Format("2006-01-02"), endDate.Format("2006-01-02")),
		GeneratedAt: time.Now(),
	}

	switch reportType {
	case "platform_overview":
		stats, err := s.GetPlatformStats(ctx)
		if err != nil {
			return nil, err
		}
		report.Data = stats
	case "revenue_analysis":
		stats, err := s.GetRevenueStats(ctx, startDate, endDate)
		if err != nil {
			return nil, err
		}
		report.Data = stats
	default:
		report.Data = gin.H{"message": "Report type not implemented"}
	}

	return report, nil
}

// GetAnalyticsService 获取分析服务（工厂函数）
func GetAnalyticsService(db *gorm.DB, cfg *config.Config) AnalyticsService {
	return NewAnalyticsService(db, cfg)
}