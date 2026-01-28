package crawler

import (
	"context"
	"fmt"
	"log"
	"skillhub/config"
	"skillhub/models"
	"time"

	"github.com/google/go-github/v56/github"
	"golang.org/x/oauth2"
)

type GitHubCrawler struct {
	client *github.Client
}

func NewGitHubCrawler() *GitHubCrawler {
	var client *github.Client

	if config.AppConfig.GitHub.Token != "" {
		ts := oauth2.StaticTokenSource(
			&oauth2.Token{AccessToken: config.AppConfig.GitHub.Token},
		)
		tc := oauth2.NewClient(context.Background(), ts)
		client = github.NewClient(tc)
	} else {
		client = github.NewClient(nil)
	}

	return &GitHubCrawler{client: client}
}

// CrawlSkillsFromTopics 从GitHub topic爬取skills
func (c *GitHubCrawler) CrawlSkillsFromTopics(topics []string, limit int) error {
	db := models.GetDB()

	for _, topic := range topics {
		log.Printf("Crawling topic: %s", topic)

		// 搜索仓库
		query := fmt.Sprintf("topic:%s language:go", topic)
		opts := &github.SearchOptions{
			Sort:  "stars",
			Order: "desc",
			ListOptions: github.ListOptions{
				PerPage: limit,
			},
		}

		repos, resp, err := c.client.Search.Repositories(context.Background(), query, opts)
		if err != nil {
			log.Printf("Error searching repositories for topic %s: %v", topic, err)
			continue
		}

		log.Printf("Found %d repositories for topic %s", *repos.Total, topic)

		// 保存或更新skills
		for _, repo := range repos.Repositories {
			err := c.saveOrUpdateSkill(repo)
			if err != nil {
				log.Printf("Error saving skill %s: %v", *repo.Name, err)
				continue
			}
		}

		// 处理分页
		for opts.ListOptions.Page*opts.ListOptions.PerPage < int(*repos.Total) {
			opts.ListOptions.Page++
			repos, _, err := c.client.Search.Repositories(context.Background(), query, opts)
			if err != nil {
				log.Printf("Error searching page %d: %v", opts.ListOptions.Page, err)
				break
			}

			for _, repo := range repos.Repositories {
				err := c.saveOrUpdateSkill(repo)
				if err != nil {
					log.Printf("Error saving skill %s: %v", *repo.Name, err)
					continue
				}
			}

			// 避免触发速率限制
			time.Sleep(1 * time.Second)
		}

		// 记录API配额
		log.Printf("GitHub API remaining: %d/%d", resp.Remaining, resp.Limit)

		// 避免触发速率限制
		time.Sleep(2 * time.Second)
	}

	return nil
}

// CrawlSkillsByRepos 从指定的仓库列表爬取
func (c *GitHubCrawler) CrawlSkillsByRepos(repos []string) error {
	db := models.GetDB()

	for _, repo := range repos {
		log.Printf("Crawling repository: %s", repo)

		owner, name, err := parseRepo(repo)
		if err != nil {
			log.Printf("Error parsing repo %s: %v", repo, err)
			continue
		}

		ghRepo, _, err := c.client.Repositories.Get(context.Background(), owner, name)
		if err != nil {
			log.Printf("Error getting repository %s: %v", repo, err)
			continue
		}

		err = c.saveOrUpdateSkill(ghRepo)
		if err != nil {
			log.Printf("Error saving skill %s: %v", *ghRepo.Name, err)
			continue
		}

		time.Sleep(500 * time.Millisecond)
	}

	return nil
}

// saveOrUpdateSkill 保存或更新skill
func (c *GitHubCrawler) saveOrUpdateSkill(repo *github.Repository) error {
	db := models.GetDB()

	var skill models.Skill
	err := db.Where("github_url = ?", *repo.HTMLURL).First(&skill).Error

	priceType := "free"
	price := 0.0
	if repo.GetSponsorCount() > 0 {
		priceType = "paid"
	}

	skillData := models.Skill{
		Name:          *repo.Name,
		Description:   repo.GetDescription(),
		GitHubURL:     *repo.HTMLURL,
		StarsCount:    repo.GetStargazersCount(),
		ForksCount:    repo.GetForksCount(),
		PriceType:     priceType,
		Price:         price,
		DownloadsCount: 0,
		PurchasesCount: 0,
		Rating:        0.0,
		IsPublished:    true,
		LastSyncAt:    time.Now(),
	}

	// 获取默认分类
	var category models.SkillCategory
	db.Where("name = ?", "Default").First(&category)
	if category.ID == 0 {
		category = models.SkillCategory{
			Name:     "Default",
			SortOrder: 999,
		}
		db.Create(&category)
	}
	skillData.CategoryID = category.ID

	if err != nil {
		// 创建新的skill
		skillData.CreatedAt = time.Now()
		return db.Create(&skillData).Error
	} else {
		// 更新现有skill
		skillData.ID = skill.ID
		skillData.CreatedAt = skill.CreatedAt
		return db.Model(&skill).Updates(skillData).Error
	}
}

// parseRepo 解析仓库路径 (owner/repo)
func parseRepo(repo string) (string, string, error) {
	if len(repo) == 0 {
		return "", "", fmt.Errorf("empty repository path")
	}

	parts := []string{}
	start := 0
	for i, r := range repo {
		if r == '/' {
			parts = append(parts, repo[start:i])
			start = i + 1
		}
	}
	parts = append(parts, repo[start:])

	if len(parts) < 2 {
		return "", "", fmt.Errorf("invalid repository path format")
	}

	return parts[len(parts)-2], parts[len(parts)-1], nil
}
