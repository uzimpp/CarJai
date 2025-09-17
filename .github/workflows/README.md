# CarJai CI/CD Workflows

This directory contains GitHub Actions workflows for the CarJai project's CI/CD pipeline.

## 🔄 Git Flow Strategy

We use a **Git Flow** branching strategy with the following branches:

- **`main`** - Production branch (stable, deployed to production)
- **`develop`** - Development branch (integration branch for features)
- **`feature/*`** - Feature branches (individual features)
- **`hotfix/*`** - Hotfix branches (urgent production fixes)

## 📋 Workflow Files

### 1. `Carjai-ci.yml` - Main CI/CD Pipeline

**Triggers:**
- Push to `develop` or `main` branches
- Pull requests to `develop` or `main` branches

**Jobs:**
- **Environment Detection** - Detects branch and sets environment variables
- **Frontend CI** - Builds and tests frontend (Node.js)
- **Backend CI** - Builds and tests backend (Go)
- **Docker Build** - Builds Docker images
- **Staging Deployment** - Deploys to staging (develop branch only)
- **Integration Tests** - Runs integration tests (develop branch only)
- **Production Deployment** - Deploys to production (main branch only)
- **Notifications** - Sends deployment notifications

### 2. `create-pr.yml` - Auto Create Pull Requests

**Triggers:**
- Push to `develop` branch
- Manual dispatch

**Purpose:**
- Automatically creates PR from `develop` to `main`
- Updates existing PR with latest commits
- Adds reviewers and labels

### 3. `merge-to-main.yml` - Manual Merge to Main

**Triggers:**
- Manual dispatch only

**Purpose:**
- Safely merges `develop` to `main` with validation
- Creates release tags
- Requires confirmation input

## 🚀 Development Workflow

### 1. Feature Development

```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push feature branch
git push origin feature/your-feature-name

# Create PR to develop
# (Use GitHub UI or create-pr.yml workflow)
```

### 2. Integration to Develop

```bash
# Merge feature to develop
git checkout develop
git pull origin develop
git merge feature/your-feature-name
git push origin develop

# This triggers:
# - CI/CD pipeline
# - Staging deployment
# - Integration tests
# - Auto PR creation to main
```

### 3. Release to Production

#### Option A: Auto PR (Recommended)
```bash
# Push to develop triggers auto PR creation
git push origin develop

# Review and merge PR in GitHub UI
# This triggers production deployment
```

#### Option B: Manual Merge
```bash
# Use GitHub Actions UI:
# 1. Go to Actions tab
# 2. Select "Merge to Main" workflow
# 3. Click "Run workflow"
# 4. Type "MERGE" to confirm
# 5. Workflow will merge and deploy
```

## 🔧 Environment Configuration

### Required Secrets

Add these secrets to your GitHub repository:

```bash
# Docker Hub (for production images)
DOCKER_USERNAME=your-docker-username
DOCKER_PASSWORD=your-docker-password

# Server Access (for deployment)
STAGING_SSH_KEY=your-staging-server-ssh-key
PRODUCTION_SSH_KEY=your-production-server-ssh-key

# Notifications (optional)
SLACK_WEBHOOK_URL=your-slack-webhook-url
DISCORD_WEBHOOK_URL=your-discord-webhook-url
```

### Environment Variables

Set these in your repository settings:

```bash
# Staging Environment
STAGING_DB_HOST=staging-db-host
STAGING_DB_PASSWORD=staging-db-password
STAGING_JWT_SECRET=staging-jwt-secret

# Production Environment
PRODUCTION_DB_HOST=production-db-host
PRODUCTION_DB_PASSWORD=production-db-password
PRODUCTION_JWT_SECRET=production-jwt-secret
```

## 📊 Branch Protection Rules

Configure these rules in GitHub repository settings:

### Main Branch
- ✅ Require pull request reviews (2 reviewers)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Restrict pushes to main branch
- ✅ Allow force pushes: ❌
- ✅ Allow deletions: ❌

### Develop Branch
- ✅ Require pull request reviews (1 reviewer)
- ✅ Require status checks to pass
- ✅ Allow force pushes: ❌
- ✅ Allow deletions: ❌

## 🎯 Deployment Environments

### Staging (develop branch)
- **URL**: `https://staging.carjai.com`
- **Database**: Staging PostgreSQL
- **Purpose**: Integration testing, QA testing
- **Auto-deploy**: ✅ (on push to develop)

### Production (main branch)
- **URL**: `https://carjai.com`
- **Database**: Production PostgreSQL
- **Purpose**: Live application
- **Auto-deploy**: ✅ (on merge to main)

## 🔍 Monitoring and Alerts

### Health Checks
- **Staging**: `https://staging.carjai.com/health`
- **Production**: `https://carjai.com/health`

### Metrics
- **Staging**: `https://staging.carjai.com/metrics`
- **Production**: `https://carjai.com/metrics`

### Logs
```bash
# Staging logs
docker logs carjai-staging-backend
docker logs carjai-staging-frontend

# Production logs
docker logs carjai-production-backend
docker logs carjai-production-frontend
```

## 🚨 Troubleshooting

### Common Issues

#### 1. CI/CD Pipeline Fails
```bash
# Check workflow logs
# Go to Actions tab → Select failed workflow → View logs

# Common fixes:
# - Fix failing tests
# - Update dependencies
# - Check environment variables
```

#### 2. Deployment Fails
```bash
# Check deployment logs
# Go to Actions tab → Select deployment job → View logs

# Common fixes:
# - Check server connectivity
# - Verify secrets are set
# - Check Docker image availability
```

#### 3. PR Not Created
```bash
# Check create-pr.yml workflow
# Ensure develop branch exists
# Verify GitHub token permissions
```

### Manual Commands

#### Force Deploy to Staging
```bash
# Trigger staging deployment manually
gh workflow run Carjai-ci.yml --ref develop
```

#### Force Deploy to Production
```bash
# Trigger production deployment manually
gh workflow run Carjai-ci.yml --ref main
```

#### Create Release Tag
```bash
# Create release tag manually
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

## 📚 Best Practices

### 1. Commit Messages
Use conventional commit format:
```
feat: add new feature
fix: fix bug in authentication
docs: update API documentation
test: add unit tests for user service
refactor: improve code structure
```

### 2. Branch Naming
```
feature/user-authentication
feature/payment-integration
hotfix/security-patch
bugfix/login-error
```

### 3. PR Descriptions
Include:
- What changes were made
- Why changes were made
- How to test the changes
- Screenshots (if UI changes)
- Breaking changes (if any)

### 4. Testing
- Write unit tests for new features
- Test locally before pushing
- Ensure all tests pass in CI
- Test in staging before production

## 🔐 Security

### Secrets Management
- Never commit secrets to code
- Use GitHub Secrets for sensitive data
- Rotate secrets regularly
- Use least privilege principle

### Access Control
- Limit who can merge to main
- Require code reviews
- Use branch protection rules
- Monitor deployment logs

---

**Note**: This workflow is designed for a team environment. Adjust branch protection rules and approval requirements based on your team size and requirements.
