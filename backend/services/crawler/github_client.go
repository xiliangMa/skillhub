package crawler

import (
	"context"
	"fmt"
	"log"
	"skillhub/config"
	"skillhub/models"
	"time"

	"github.com/google/go-github/v58/github"
	"github.com/google/uuid"
	"golang.org/x/oauth2"
)

// GitHubClient GitHub API客户端封装
type GitHubClient struct {
	client *github.Client
	config *config.GitHubConfig
	ctx    context.Context
}

// NewGitHubClient 创建新的GitHub客户端
func NewGitHubClient(cfg *config.GitHubConfig) *GitHubClient {
	ctx := context.Background()

	var client *github.Client
	if cfg.Token != "" {
		ts := oauth2.StaticTokenSource(
			&oauth2.Token{AccessToken: cfg.Token},
		)
		tc := oauth2.NewClient(ctx, ts)
		client = github.NewClient(tc)
	} else {
		client = github.NewClient(nil)
		log.Println("Warning: GitHub client created without token, rate limit will be low")
	}

	return &GitHubClient{
		client: client,
		config: cfg,
		ctx:    ctx,
	}
}

// SearchRepositoriesByTopic 根据主题搜索GitHub仓库
func (c *GitHubClient) SearchRepositoriesByTopic(topic string, page int) ([]*github.Repository, *github.Response, error) {
	query := fmt.Sprintf("topic:%s", topic)
	opts := &github.SearchOptions{
		ListOptions: github.ListOptions{
			Page:    page,
			PerPage: c.config.PerPage,
		},
		Sort:  "stars",
		Order: "desc",
	}

	result, resp, err := c.client.Search.Repositories(c.ctx, query, opts)
	if err != nil {
		return nil, resp, err
	}

	return result.Repositories, resp, nil
}

// GetRepositoryDetails 获取仓库详细信息
func (c *GitHubClient) GetRepositoryDetails(owner, repo string) (*github.Repository, error) {
	repository, _, err := c.client.Repositories.Get(c.ctx, owner, repo)
	return repository, err
}

// ConvertToSkillModel 将GitHub仓库转换为技能模型
func (c *GitHubClient) ConvertToSkillModel(repo *github.Repository, topic string) *models.Skill {
	if repo == nil {
		return nil
	}

	// 设置分类ID（暂时为nil，后续可以添加分类映射逻辑）
	var categoryID *uuid.UUID = nil

	// 确定分类
	category := "其他"
	if repo.Language != nil {
		switch *repo.Language {
		case "Go", "Python", "JavaScript", "TypeScript", "Java", "C++":
			category = "开发工具"
		case "Markdown", "HTML", "CSS":
			category = "文档"
		}
	}

	// 创建技能
	now := time.Now()
	skill := &models.Skill{
		Name:        repo.GetName(),
		Description: repo.GetDescription(),
		GitHubURL:   repo.GetHTMLURL(),
		StarsCount:  repo.GetStargazersCount(),
		ForksCount:  repo.GetForksCount(),
		PriceType:   models.PriceTypeFree, // 默认免费
		Price:       0,
		IsActive:    true,
		LastSyncAt:  &now,
		SyncSource:  "github",
		CategoryID:  categoryID,
	}

	// 注意：Tags字段需要通过many2many关系单独处理
	// 这里不直接设置Tags，后续可以添加标签创建逻辑

	return skill
}

// GetRateLimit 获取API速率限制信息
func (c *GitHubClient) GetRateLimit() (*github.RateLimits, error) {
	rate, _, err := c.client.RateLimit.Get(c.ctx)
	return rate, err
}