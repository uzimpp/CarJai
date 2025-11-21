# Developer Documentation

Technical guide for developers working on the CarJai codebase. This document covers setup, project structure, development workflow, and best practices.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Database](#database)
6. [Environment Variables](#environment-variables)
7. [Docker Development](#docker-development)
8. [Code Quality](#code-quality)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Docker** and **Docker Compose** (recommended for local development)
- **Go** 1.24.3 or higher (for backend development)
- **Node.js** 18.x or 20.x (for frontend development)
- **PostgreSQL** 15 or higher (if running without Docker)
- **Git** (for version control)

### Recommended Tools

- **VS Code** or **GoLand** (IDE)
- **Postman** or **Insomnia** (API testing)
- **pgAdmin** or **DBeaver** (database management)

---

## Quick Start

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/uzimpp/CarJai.git
   cd CarJai
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start all services**
   ```bash
   docker compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Database: localhost:5432 (credentials in .env)

5. **Run database migrations**
   ```bash
   docker exec -it carjai-backend sh -c "cd /app && go run main.go migrate"
   ```

6. **Seed test data (optional)**
   ```bash
   docker exec -it carjai-backend /app/scripts/seed --all
   ```

### Manual Setup

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install Go dependencies**
   ```bash
   go mod download
   go mod tidy
   ```

3. **Set up environment variables**
   - Copy `env.example` to `.env` in project root
   - Configure database, JWT secrets, and API keys

4. **Set up PostgreSQL database**
   - Create database: `createdb carjai`
   - Run migrations: `psql carjai < migrations/001_admin_auth.sql` (repeat for all migrations)

5. **Run the backend**
   ```bash
   go run main.go
   ```

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Create `.env.local` file
   - Add: `NEXT_PUBLIC_API_URL=http://localhost:8080`

4. **Run the frontend**
   ```bash
   npm run dev
   ```

---

## Project Structure

### Backend Structure

```
backend/
├── config/              # Configuration management
│   ├── app.go          # Application configuration
│   └── database.go     # Database configuration
├── handlers/           # HTTP request handlers
│   ├── admin_*.go      # Admin handlers
│   ├── car_handler.go  # Car-related handlers
│   ├── user_auth.go    # User authentication handlers
│   └── ...
├── middleware/         # HTTP middleware
│   ├── auth.go         # Authentication middleware
│   ├── cors.go         # CORS middleware
│   ├── rate_limit.go   # Rate limiting middleware
│   └── logging.go      # Request logging middleware
├── models/             # Database models & repositories
│   ├── car.go          # Car model and repository
│   ├── user.go         # User model and repository
│   ├── database.go     # Database connection and repositories
│   └── ...
├── routes/             # API route definitions
│   ├── admin.go        # Admin routes
│   ├── car_routes.go   # Car routes
│   ├── user.go         # User authentication routes
│   └── ...
├── services/           # Business logic services
│   ├── car_service.go  # Car business logic
│   ├── user_service.go # User business logic
│   ├── ocr_service.go  # OCR document extraction
│   └── ...
├── utils/              # Utility functions
│   ├── jwt.go          # JWT token management
│   ├── password.go     # Password hashing
│   ├── logger.go       # Logging utilities
│   └── ...
├── migrations/         # Database schema migrations
│   ├── 001_admin_auth.sql
│   ├── 002_user_auth.sql
│   └── ...
├── tests/              # Test files
│   ├── handlers/       # Handler tests
│   └── *_test.go       # Unit and integration tests
├── scripts/            # Utility scripts
│   ├── seed.go         # Database seeding
│   └── ...
├── docs/               # Documentation
│   ├── swagger.yaml    # API documentation
│   └── schema.md       # Database schema
└── main.go             # Application entry point
```

### Frontend Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── admin/             # Admin dashboard pages
│   │   ├── browse/           # Car browsing page
│   │   ├── car/               # Car details pages
│   │   ├── sell/              # Car selling pages
│   │   ├── signin/            # Sign in page
│   │   ├── signup/            # Sign up pages
│   │   ├── guides/            # User guides
│   │   └── ...
│   ├── components/            # React components
│   │   ├── auth/              # Authentication components
│   │   ├── car/               # Car-related components
│   │   ├── global/           # Global UI components
│   │   └── ...
│   ├── lib/                   # Utility libraries
│   │   ├── auth.ts            # Authentication utilities
│   │   ├── api.ts             # API client
│   │   └── ...
│   ├── types/                 # TypeScript type definitions
│   ├── hooks/                 # Custom React hooks
│   └── utils/                 # Utility functions
├── public/                    # Static assets
├── package.json
├── next.config.ts
└── tsconfig.json
```

---

## Development Workflow

### Git Branching Strategy

We follow Git Flow with the following branches:

- **main**: Production-ready, stable code only
- **develop**: Integration branch for tested features
- **feature/***: New features (e.g., `feature/add-favorites`)
- **bugfix/***: Fixes for non-critical issues
- **hotfix/***: Urgent fixes to main

**Branch naming conventions**:
- `feature/frontend-<name>` - Frontend features
- `feature/backend-<name>` - Backend features
- `feature/fullstack-<name>` - Full-stack features
- `bugfix/frontend-<name>` - Frontend bug fixes
- `bugfix/backend-<name>` - Backend bug fixes
- `hotfix/backend-<name>` - Urgent backend fixes
- `chore/infra-<name>` - Infrastructure changes

### Commit Message Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting, no code changes
- `refactor`: Code restructuring
- `test`: Adding/updating tests
- `chore`: Maintenance, dependencies, configs

**Examples**:
```
feat(frontend): add favorites page
fix(backend): resolve JWT token expiration issue
docs(api): update swagger documentation
refactor(backend): restructure car service
```

### Pull Request Process

1. **Create a branch** from `develop` (or `main` for hotfixes)
2. **Make changes** and commit following conventions
3. **Push to remote** and create a Pull Request
4. **Request review** from at least one team member
5. **Address feedback** and update PR
6. **Merge** after approval and CI checks pass

**PR Template**:
- Description of changes
- Checklist of modifications
- Testing instructions
- Notes for reviewers

---

## Database

### Schema Documentation

Complete database schema documentation: `backend/docs/schema.md`

### Migrations

Database migrations are located in `backend/migrations/`:

1. `000_extensions.sql` - PostgreSQL extensions
2. `001_admin_auth.sql` - Admin authentication tables
3. `002_user_auth.sql` - User authentication tables
4. `003_reference_tables.sql` - Reference data tables
5. `004_seller.sql` - Seller tables
6. `005_cars.sql` - Car listing tables
7. `006_buyer.sql` - Buyer tables
8. `007_market_price.sql` - Market price tables
9. `008_recent_views.sql` - Recent views tables
10. `009_favourites.sql` - Favourites tables
11. `010_reports.sql` - Reports tables

**Running migrations**:
- Manually: Execute SQL files in order
- Programmatically: Use migration tool (if implemented)

### Seeding

Use the unified seeding system for test data:

```bash
# Seed everything
docker exec -it carjai-backend /app/scripts/seed --all

# Seed specific data
docker exec -it carjai-backend /app/scripts/seed --users --cars

# View help
docker exec -it carjai-backend /app/scripts/seed
```

**Available options**:
- `--all` - Seed everything
- `--users` - Seed users, sellers, buyers
- `--cars` - Seed cars with images
- `--reports` - Seed reports
- `--favorites` - Seed favourites
- `--recent-views` - Seed recent views
- `--market-price` - Seed market prices from PDF

---

## Environment Variables

All environment variables are configured in `.env` file (root directory).

### Required Variables

**Database**:
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name

**JWT Secrets**:
- `JWT_SECRET` - User JWT secret
- `ADMIN_JWT_SECRET` - Admin JWT secret

**Application**:
- `ENVIRONMENT` - Environment (development, production)
- `PORT` - Backend server port
- `CORS_ALLOWED_ORIGINS` - Comma-separated allowed origins

### Optional Variables

**Google OAuth**:
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_REDIRECT_URI` - OAuth redirect URI

**OCR Service**:
- `AIGEN_API_KEY` - Aigen API key for document extraction

**Admin**:
- `ADMIN_ROUTE_PREFIX` - Admin route prefix (default: `/admin`)
- `ADMIN_IP_WHITELIST` - Comma-separated IP addresses

See `env.example` for complete list.

---

## Docker Development

### Docker Compose Services

**Frontend** (`carjai-frontend`):
- Next.js development server
- Port: 3000
- Hot reload enabled

**Backend** (`carjai-backend`):
- Go HTTP server
- Port: 8080
- Auto-reload on code changes

**Database** (`carjai-database`):
- PostgreSQL 15
- Port: 5432
- Persistent volume for data

### Useful Docker Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Rebuild containers
docker compose up -d --build

# Execute command in container
docker exec -it carjai-backend sh
docker exec -it carjai-frontend sh

# Access database
docker exec -it carjai-database psql -U carjai_user -d carjai
```

---

## Code Quality

### Backend (Go)

**Formatting**:
```bash
go fmt ./...
```

**Linting**:
```bash
golangci-lint run
```

**Code Style**:
- Follow Go conventions
- Use meaningful variable names
- Add comments for exported functions
- Keep functions focused and small

### Frontend (TypeScript/React)

**Formatting**:
```bash
npm run format
```

**Linting**:
```bash
npm run lint
```

**Code Style**:
- Follow TypeScript best practices
- Use functional components with hooks
- Keep components small and focused
- Use TypeScript types strictly

---

## Testing

### Backend Tests

**Run all tests**:
```bash
docker exec -it carjai-backend go test ./...
```

**Run specific test**:
```bash
docker exec -it carjai-backend go test ./tests/handlers/...
```

**Run with verbose output**:
```bash
docker exec -it carjai-backend go test -v ./...
```

**Run with coverage**:
```bash
docker exec -it carjai-backend go test -cover ./...
```

**Generate detailed coverage report**:
```bash
docker exec -it carjai-backend sh -c "cd /app && go test -coverprofile=coverage.out ./... && go tool cover -html=coverage.out -o coverage.html"
docker cp carjai-backend:/app/coverage.html ./coverage.html
```

**Run specific test function**:
```bash
docker exec -it carjai-backend go test -v -run TestFunctionName ./...
```

### Frontend Tests

(To be implemented)

**Note**: When frontend tests are implemented, they should also be run in Docker:
```bash
docker exec -it carjai-frontend npm test
```

---

## Troubleshooting

### Common Issues

**Database connection errors**:
- Check database is running
- Verify environment variables
- Check network connectivity

**Port already in use**:
- Change port in `.env`
- Kill process using the port

**Docker issues**:
- Restart Docker daemon
- Rebuild containers: `docker compose up -d --build`
- Check logs: `docker compose logs`

**Migration errors**:
- Ensure migrations run in order
- Check database schema matches migrations

### Getting Help

- Check existing documentation
- Review code comments
- Ask team members
- Check GitHub issues

---

## Additional Resources

- **API Documentation**: `docs/API-Documentation.md`
- **User Documentation**: `docs/User-Documentation.md`
- **System Documentation**: `docs/System-Documentation.md`
- **Test Documentation**: `docs/Test-Documentation.md`
- **Backend README**: `backend/README.md`
- **Frontend README**: `frontend/README.md`

---

**Last Updated**: 2024

