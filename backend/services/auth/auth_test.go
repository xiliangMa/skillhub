package auth

import (
	"strings"
	"testing"

	"skillhub/config"
	"skillhub/models"

	"golang.org/x/oauth2"
)

func TestInitOAuth(t *testing.T) {
	// Setup test config
	config.AppConfig = &config.Config{
		OAuth: config.OAuthConfig{
			GitHub: config.OAuthProvider{
				AppID:     "test-github-client-id",
				AppSecret: "test-github-client-secret",
				Redirect:  "http://localhost:8080/auth/github/callback",
			},
			Google: config.OAuthProvider{
				AppID:     "test-google-client-id",
				AppSecret: "test-google-client-secret",
				Redirect:  "http://localhost:8080/auth/google/callback",
			},
		},
	}

	// Test that InitOAuth doesn't panic
	func() {
		defer func() {
			if r := recover(); r != nil {
				t.Errorf("InitOAuth panicked: %v", r)
			}
		}()
		InitOAuth()
	}()

	// Check that configs are created
	if githubOAuthConfig == nil {
		t.Error("githubOAuthConfig should not be nil")
	}
	if googleOAuthConfig == nil {
		t.Error("googleOAuthConfig should not be nil")
	}

	// Verify config types
	if _, ok := interface{}(githubOAuthConfig).(*oauth2.Config); !ok {
		t.Error("githubOAuthConfig should be of type *oauth2.Config")
	}
	if _, ok := interface{}(googleOAuthConfig).(*oauth2.Config); !ok {
		t.Error("googleOAuthConfig should be of type *oauth2.Config")
	}
}

func TestOAuthCallbackResponse(t *testing.T) {
	response := OAuthCallbackResponse{
		Token: "jwt_token_123",
		User:  models.User{},
	}

	if response.Token != "jwt_token_123" {
		t.Errorf("Expected token 'jwt_token_123', got '%s'", response.Token)
	}
}

func TestOAuthScopes(t *testing.T) {
	// Setup test config
	config.AppConfig = &config.Config{
		OAuth: config.OAuthConfig{
			GitHub: config.OAuthProvider{
				AppID:     "test-github-client-id",
				AppSecret: "test-github-client-secret",
				Redirect:  "http://localhost:8080/auth/github/callback",
			},
			Google: config.OAuthProvider{
				AppID:     "test-google-client-id",
				AppSecret: "test-google-client-secret",
				Redirect:  "http://localhost:8080/auth/google/callback",
			},
		},
	}
	InitOAuth()

	// Test GitHub scopes
	githubScopes := githubOAuthConfig.Scopes
	foundGitHubScope := false
	for _, scope := range githubScopes {
		if scope == "user:email" {
			foundGitHubScope = true
			break
		}
	}
	if !foundGitHubScope {
		t.Error("GitHub scopes should contain 'user:email'")
	}
	if len(githubScopes) != 1 {
		t.Errorf("Expected 1 GitHub scope, got %d", len(githubScopes))
	}

	// Test Google scopes
	googleScopes := googleOAuthConfig.Scopes
	foundEmailScope := false
	foundProfileScope := false
	for _, scope := range googleScopes {
		if scope == "https://www.googleapis.com/auth/userinfo.email" {
			foundEmailScope = true
		}
		if scope == "https://www.googleapis.com/auth/userinfo.profile" {
			foundProfileScope = true
		}
	}
	if !foundEmailScope {
		t.Error("Google scopes should contain 'https://www.googleapis.com/auth/userinfo.email'")
	}
	if !foundProfileScope {
		t.Error("Google scopes should contain 'https://www.googleapis.com/auth/userinfo.profile'")
	}
	if len(googleScopes) != 2 {
		t.Errorf("Expected 2 Google scopes, got %d", len(googleScopes))
	}
}

func TestOAuthEndpointConfiguration(t *testing.T) {
	// Setup test config
	config.AppConfig = &config.Config{
		OAuth: config.OAuthConfig{
			GitHub: config.OAuthProvider{
				AppID:     "test-github-client-id",
				AppSecret: "test-github-client-secret",
				Redirect:  "http://localhost:8080/auth/github/callback",
			},
			Google: config.OAuthProvider{
				AppID:     "test-google-client-id",
				AppSecret: "test-google-client-secret",
				Redirect:  "http://localhost:8080/auth/google/callback",
			},
		},
	}
	InitOAuth()

	// GitHub endpoint should be set
	if githubOAuthConfig.Endpoint.AuthURL == "" {
		t.Error("GitHub endpoint AuthURL should not be empty")
	}
	if !strings.Contains(githubOAuthConfig.Endpoint.AuthURL, "github.com") {
		t.Errorf("GitHub AuthURL should contain 'github.com', got: %s", githubOAuthConfig.Endpoint.AuthURL)
	}
	if !strings.Contains(githubOAuthConfig.Endpoint.TokenURL, "github.com") {
		t.Errorf("GitHub TokenURL should contain 'github.com', got: %s", githubOAuthConfig.Endpoint.TokenURL)
	}

	// Google endpoint should be set
	if googleOAuthConfig.Endpoint.AuthURL == "" {
		t.Error("Google endpoint AuthURL should not be empty")
	}
	if !strings.Contains(googleOAuthConfig.Endpoint.AuthURL, "google") {
		t.Errorf("Google AuthURL should contain 'google', got: %s", googleOAuthConfig.Endpoint.AuthURL)
	}
	if !strings.Contains(googleOAuthConfig.Endpoint.TokenURL, "google") {
		t.Errorf("Google TokenURL should contain 'google', got: %s", googleOAuthConfig.Endpoint.TokenURL)
	}
}

func TestOAuthConfigFields(t *testing.T) {
	// Setup test config
	config.AppConfig = &config.Config{
		OAuth: config.OAuthConfig{
			GitHub: config.OAuthProvider{
				AppID:     "test-github-client-id",
				AppSecret: "test-github-client-secret",
				Redirect:  "http://localhost:8080/auth/github/callback",
			},
			Google: config.OAuthProvider{
				AppID:     "test-google-client-id",
				AppSecret: "test-google-client-secret",
				Redirect:  "http://localhost:8080/auth/google/callback",
			},
		},
	}
	InitOAuth()

	// Test GitHub config fields
	if githubOAuthConfig.ClientID == "" {
		t.Error("GitHub ClientID should be set (could be empty from config)")
	}
	if githubOAuthConfig.ClientSecret == "" {
		t.Error("GitHub ClientSecret should be set (could be empty from config)")
	}
	if githubOAuthConfig.RedirectURL == "" {
		t.Error("GitHub RedirectURL should be set (could be empty from config)")
	}

	// Test Google config fields
	if googleOAuthConfig.ClientID == "" {
		t.Error("Google ClientID should be set (could be empty from config)")
	}
	if googleOAuthConfig.ClientSecret == "" {
		t.Error("Google ClientSecret should be set (could be empty from config)")
	}
	if googleOAuthConfig.RedirectURL == "" {
		t.Error("Google RedirectURL should be set (could be empty from config)")
	}
}