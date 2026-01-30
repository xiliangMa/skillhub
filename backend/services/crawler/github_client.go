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

	// 确定分类（这里计算了分类但未使用，因为CategoryID暂时为nil）
	// 后续可以添加分类映射逻辑
	_ = "其他" // 占位符，避免未使用变量错误
	if repo.Language != nil {
		switch *repo.Language {
		case "Go", "Python", "JavaScript", "TypeScript", "Java", "C++":
			_ = "开发工具"
		case "Markdown", "HTML", "CSS":
			_ = "文档"
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

// GetSkillMetadata 获取仓库的SKILL.md文件并解析元数据
func (c *GitHubClient) GetSkillMetadata(owner, repo string) (*SkillMetadata, error) {
	// 尝试获取SKILL.md文件
	fileContent, _, _, err := c.client.Repositories.GetContents(c.ctx, owner, repo, "SKILL.md", nil)
	if err != nil {
		// 文件不存在，返回nil
		return nil, nil
	}

	// 解码文件内容
	content, err := fileContent.GetContent()
	if err != nil {
		return nil, fmt.Errorf("failed to decode file content: %w", err)
	}

	// 解析元数据
	return parseSkillMetadata(content)
}

// ConvertToSkillModelWithMetadata 使用SKILL.md元数据转换为技能模型
func (c *GitHubClient) ConvertToSkillModelWithMetadata(repo *github.Repository, topic string) *models.Skill {
	if repo == nil {
		return nil
	}

	// 获取SKILL.md元数据
	var skillMetadata *SkillMetadata
	if repo.Owner != nil && repo.Name != nil {
		metadata, err := c.GetSkillMetadata(repo.Owner.GetLogin(), repo.GetName())
		if err == nil && metadata != nil {
			skillMetadata = metadata
		}
	}

	// 设置分类ID（暂时为nil，后续可以添加分类映射逻辑）
	var categoryID *uuid.UUID = nil

	// 确定分类（这里计算了分类但未使用，因为CategoryID暂时为nil）
	// 后续可以添加分类映射逻辑
	_ = "其他" // 占位符，避免未使用变量错误
	if skillMetadata != nil && skillMetadata.Category != "" {
		_ = skillMetadata.Category
	} else if repo.Language != nil {
		switch *repo.Language {
		case "Go", "Python", "JavaScript", "TypeScript", "Java", "C++":
			_ = "开发工具"
		case "Markdown", "HTML", "CSS":
			_ = "文档"
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

	// 如果从SKILL.md获取到元数据，更新技能信息
	if skillMetadata != nil {
		if skillMetadata.Name != "" {
			skill.Name = skillMetadata.Name
		}
		if skillMetadata.Description != "" {
			skill.Description = skillMetadata.Description
		}
		skill.PriceType = skillMetadata.PriceType
		skill.Price = skillMetadata.Price
		// 注意：Tags字段需要通过many2many关系单独处理
	}

	return skill
}