# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack SaaS application called "Skills商店SaaS平台" (Skills Store SaaS Platform) - a professional AI Skills marketplace platform supporting skill display, purchase, download, and analytics. The application is built with:

- **Backend**: Go 1.23 with Gin framework, PostgreSQL, Redis
- **Frontend**: Next.js 14 (App Router) with TypeScript and Tailwind CSS
- **Infrastructure**: Docker Compose with Nginx reverse proxy

## Architecture

### Directory Structure
```
skillhub/
├── backend/          # Go backend service
│   ├── api/         # API routes (auth, skills, payment, admin, analytics)
│   ├── models/      # Data models (users, skills, orders, analytics)
│   ├── services/    # Business logic (auth, payment, scheduler, crawler)
│   ├── config/      # Configuration management
│   ├── middleware/  # Authentication and authorization middleware
│   ├── lib/         # Utility libraries
│   ├── cron/        # Scheduled tasks
│   └── main.go      # Application entry point
├── frontend/        # Next.js frontend
│   ├── app/         # App Router pages
│   ├── components/  # React components (UI, layout, skill-card)
│   ├── contexts/    # React contexts (user, i18n)
│   ├── lib/         # Utility functions and API client
│   ├── locales/     # Internationalization files (Chinese/English)
│   ├── stores/      # State management (Zustand)
│   ├── hooks/       # Custom React hooks
│   └── types/       # TypeScript type definitions
├── docker/          # Docker configurations
│   ├── nginx/      # Nginx configuration
│   └── postgres/   # PostgreSQL initialization scripts
├── docs/           # Documentation and design plans
└── scripts/        # Development shell scripts
```

### Key Architectural Patterns
- **Authentication**: JWT + OAuth 2.0 (GitHub, Google, WeChat, Feishu, Xiaohongshu)
- **Payment Integration**: Multi-channel (Alipay, WeChat Pay, Stripe, PayPal)
- **Internationalization**: next-intl with Chinese/English support
- **API Documentation**: Swagger UI at `/swagger/index.html`
- **Database**: PostgreSQL with GORM ORM
- **Caching**: Redis for sessions and performance

## Development Commands

### Docker-Based Development (Recommended)
```bash
# One-click start all services
./start.sh

# Or use Make commands
make dev          # Start development environment
make build        # Build all services
make stop         # Stop all services
make logs         # View logs
make clean        # Clean containers and data
make migration    # Run database migrations
make swagger      # Generate Swagger documentation
make test-backend # Run backend tests
make test-frontend # Run frontend tests
```

### Manual Development (Without Docker)
```bash
# Start database services only
docker-compose up postgres redis -d

# Backend development
cd backend
go mod tidy
go run main.go

# Frontend development
cd frontend
npm install
npm run dev
```

### Complete Development Environment
```bash
# Full development setup (databases + backend + frontend)
./run-dev.sh
```

## Service Access URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/swagger/index.html
- **Nginx Entry**: http://localhost
- **Health Check**: http://localhost:8080/health

## Configuration

### Environment Variables
Copy `.env.example` to `.env` and configure:
- Database connection (`DB_*` variables)
- Redis connection (`REDIS_*` variables)
- JWT secret (`JWT_SECRET`)
- OAuth providers (`GITHUB_*`, `GOOGLE_*`, `WECHAT_*`, etc.)
- Payment gateways (`ALIPAY_*`, `STRIPE_*`, `PAYPAL_*`, etc.)

### Key Configuration Files
- `docker-compose.yml` - Service definitions and networking
- `backend/config/config.go` - Go application configuration
- `frontend/next.config.js` - Next.js configuration
- `frontend/tailwind.config.ts` - Tailwind CSS configuration

## Testing

### API Testing
```bash
./test-api.sh
```

### Internationalization Testing
```bash
./test-i18n.sh
```

### Backend Tests
```bash
cd backend && go test ./...
```

### Frontend Tests
```bash
cd frontend && npm test
```

## Codebase Conventions

### Backend (Go)
- Use GORM for database operations
- API routes organized by domain in `backend/api/`
- Business logic in `backend/services/`
- Models in `backend/models/` with proper relationships
- Middleware for authentication and authorization
- Swagger annotations for API documentation

### Frontend (Next.js)
- App Router structure in `frontend/app/`
- Components in `frontend/components/` with shadcn/ui patterns
- Internationalization using `next-intl` with locale files in `frontend/locales/`
- State management with Zustand stores
- API client with Axios in `frontend/lib/api.ts`
- TypeScript types in `frontend/types/`

### Styling
- Tailwind CSS with custom configuration
- Component variants using `class-variance-authority`
- Consistent spacing and color system

## Database

### Initialization
Database schema is initialized via `docker/postgres/init.sql`. The PostgreSQL container automatically runs this script on first startup.

### Migrations
Run database migrations with:
```bash
cd backend && go run main.go migrate
```

## Development Notes

### Authentication Flow
1. OAuth providers configured in environment variables
2. JWT tokens for API authentication
3. Session management with Redis
4. Role-based access control (user/admin)

### Payment Integration
- Unified payment interface supporting multiple providers
- Payment status tracking and webhook handling
- Refund and cancellation support

### GitHub Skills Crawler
- Scheduled task to fetch skills from GitHub
- Data normalization and storage
- Update frequency configurable via cron

### Admin Features
- Complete admin dashboard
- User management
- Skill moderation
- Analytics and reporting
- System configuration

## Troubleshooting

### Common Issues
1. **Database connection errors**: Ensure PostgreSQL container is running and `.env` DB credentials are correct
2. **Redis connection errors**: Check Redis container status and connection settings
3. **OAuth configuration**: Verify provider credentials in `.env` and callback URLs
4. **Payment integration**: Test with sandbox credentials before production

### Logs
```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Health Checks
- Backend: `http://localhost:8080/health`
- Database: Check container status with `docker-compose ps`

## Deployment

### Production Build
```bash
# Build all services
make build

# Or build individually
cd backend && go build
cd frontend && npm run build
```

### Docker Deployment
```bash
# Production deployment (if docker-compose.prod.yml exists)
make deploy
```

## Additional Resources

- **Design Documents**: `docs/plans/` contains detailed architecture and implementation plans
- **CodeBuddy Rules**: `.codebuddy/rules/tcb/` contains development guidelines and best practices
- **Testing Documentation**: See `TESTING.md` for comprehensive testing strategies
- **Internationalization Report**: See `I18N-REPORT.md` for i18n implementation details