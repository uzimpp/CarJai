# Docker Documentation

Comprehensive guide to Docker setup, structure, and configuration for the CarJai platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Docker Compose Structure](#docker-compose-structure)
3. [Backend Dockerfile](#backend-dockerfile)
4. [Frontend Dockerfile](#frontend-dockerfile)
5. [Services Configuration](#services-configuration)
6. [Networks and Volumes](#networks-and-volumes)
7. [Environment Variables](#environment-variables)
8. [Health Checks](#health-checks)
9. [Common Docker Commands](#common-docker-commands)
10. [Troubleshooting](#troubleshooting)

---

## Overview

CarJai uses Docker and Docker Compose for containerization and orchestration. The platform consists of three main services:

- **Database**: PostgreSQL 15 (Alpine)
- **Backend**: Go HTTP server
- **Frontend**: Next.js 14 application

All services are orchestrated through `docker-compose.yml` and communicate via a Docker bridge network.

---

## Docker Compose Structure

### File Location

```
CarJai/
├── docker-compose.yml      # Main Docker Compose configuration
├── backend/
│   ├── dockerfile          # Production backend Dockerfile
│   └── Dockerfile.dev      # Development backend Dockerfile
└── frontend/
    └── dockerfile          # Frontend Dockerfile
```

### Services Overview

The `docker-compose.yml` defines three services:

1. **database** - PostgreSQL database server
2. **backend** - Go API server
3. **frontend** - Next.js web application

### Network Architecture

```
┌─────────────────────────────────────────┐
│         carjai-network (bridge)         │
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────┐ │
│  │ Frontend │──│ Backend   │──│ DB   │ │
│  │ :3000    │  │ :8080     │  │ :5432│ │
│  └──────────┘  └──────────┘  └──────┘ │
│                                         │
└─────────────────────────────────────────┘
```

---

## Backend Dockerfile

### Production Dockerfile (`backend/dockerfile`)

**Multi-stage build** for optimized production image:

#### Stage 1: Builder

```dockerfile
FROM golang:1.24.3-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates

WORKDIR /app

# Copy dependency files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build main application
RUN CGO_ENABLED=0 GOOS=linux go build -mod=mod -a -installsuffix cgo -o main .

# Build seed binary
RUN CGO_ENABLED=0 GOOS=linux go build -mod=mod -a -installsuffix cgo -o seed ./scripts/
```

**What it does**:
- Uses Go 1.24.3 Alpine base image
- Downloads Go module dependencies
- Builds the main application binary
- Builds the seed script binary

#### Stage 2: Runtime

```dockerfile
FROM alpine:latest

# Install runtime dependencies
RUN apk update && \
    apk add --no-cache \
    ca-certificates \
    poppler-utils \
    chromium nss freetype harfbuzz ttf-freefont \
    wget && \
    rm -rf /var/cache/apk/*

ENV CHROME_BIN=/usr/bin/chromium

WORKDIR /app/

# Copy binaries from builder
COPY --from=builder /app/main .
COPY --from=builder /app/seed ./scripts/
COPY scripts/seed.sh ./scripts/

EXPOSE 8080

CMD ["./main"]
```

**Runtime dependencies**:
- `ca-certificates`: HTTPS support
- `poppler-utils`: PDF extraction (pdftotext)
- `chromium`: Headless browser for web scraping
- `wget`: Health check utility

**Image size**: Optimized by using Alpine Linux and multi-stage build

### Development Dockerfile (`backend/Dockerfile.dev`)

```dockerfile
FROM golang:1.24.3-alpine

# Install development tools
RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

EXPOSE 8080

# Run with hot reload
CMD ["go", "run", "main.go"]
```

**Differences from production**:
- Single-stage build (no optimization needed)
- Includes timezone data
- Runs with `go run` for hot reload
- Larger image size (includes Go toolchain)

---

## Frontend Dockerfile

### Production Dockerfile (`frontend/dockerfile`)

```dockerfile
FROM node:alpine

WORKDIR /app

# Build argument for Docker environment detection
ARG DOCKER_ENV
ENV DOCKER_ENV=$DOCKER_ENV

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Build Next.js application
RUN npm run build

EXPOSE 3000

# Start production server
CMD ["npm", "start"]
```

**Build process**:
1. Uses Node.js Alpine base image
2. Installs npm dependencies
3. Copies application source code
4. Builds Next.js production bundle
5. Starts production server

**Optimizations**:
- Alpine Linux for smaller image size
- Multi-layer caching (package.json copied first)
- Production build optimized by Next.js

---

## Services Configuration

### Database Service

```yaml
database:
  image: postgres:15-alpine
  environment:
    POSTGRES_DB: ${POSTGRES_DB}
    POSTGRES_USER: ${POSTGRES_USER}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  ports:
    - "5432:5432"
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./backend/migrations:/docker-entrypoint-initdb.d
  networks:
    - carjai-network
  restart: unless-stopped
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
    interval: 10s
    timeout: 5s
    retries: 3
    start_period: 10s
```

**Configuration**:
- **Image**: PostgreSQL 15 Alpine (lightweight)
- **Port**: 5432 (exposed to host)
- **Volumes**:
  - `postgres_data`: Persistent database storage
  - `./backend/migrations`: Auto-run migrations on first start
- **Health check**: Checks database readiness
- **Restart policy**: Automatically restart unless stopped

### Backend Service

```yaml
backend:
  container_name: carjai-backend
  build:
    context: ./backend
    dockerfile: dockerfile
  ports:
    - "8080:8080"
  dns:
    - 8.8.8.8
    - 8.8.4.4
  environment:
    # Database
    DB_NAME: ${DB_NAME}
    DB_PASSWORD: ${DB_PASSWORD}
    DB_USER: ${DB_USER}
    DB_HOST: ${DB_HOST}
    DB_PORT: ${DB_PORT}
    # JWT
    USER_JWT_SECRET: ${USER_JWT_SECRET}
    ADMIN_JWT_SECRET: ${ADMIN_JWT_SECRET}
    # ... (see Environment Variables section)
  volumes:
    - ./frontend/public/assets:/app/frontend/public/assets:ro
    - ./backend/tests/price2568.pdf:/app/tests/price2568.pdf:ro
  networks:
    - carjai-network
  depends_on:
    database:
      condition: service_healthy
  restart: unless-stopped
  healthcheck:
    test: ["CMD-SHELL", "wget --tries=1 --spider http://localhost:8080/health || exit 1"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

**Configuration**:
- **Build**: Uses `./backend/dockerfile`
- **Port**: 8080 (exposed to host)
- **DNS**: Google DNS (8.8.8.8, 8.8.4.4) for external API calls
- **Volumes**:
  - Frontend assets (read-only): For serving static files
  - Test PDF (read-only): For market price extraction
- **Dependencies**: Waits for database to be healthy
- **Health check**: Checks `/health` endpoint

### Frontend Service

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: dockerfile
    args:
      DOCKER_ENV: "true"
  ports:
    - "3000:3000"
  environment:
    NODE_ENV: ${NODE_ENV}
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: ${NEXT_PUBLIC_GOOGLE_CLIENT_ID}
    NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
  networks:
    - carjai-network
  depends_on:
    backend:
      condition: service_healthy
  restart: unless-stopped
  healthcheck:
    test: ["CMD-SHELL", "wget --tries=1 --spider http://localhost:3000 || exit 1"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

**Configuration**:
- **Build**: Uses `./frontend/dockerfile` with `DOCKER_ENV` argument
- **Port**: 3000 (exposed to host)
- **Environment**: Next.js public environment variables
- **Dependencies**: Waits for backend to be healthy
- **Health check**: Checks frontend availability

---

## Networks and Volumes

### Networks

**carjai-network** (bridge):
- Type: Bridge network
- Purpose: Isolated network for all services
- Services: database, backend, frontend
- Communication: Services can communicate using service names

**Service Discovery**:
- Database: `database:5432`
- Backend: `backend:8080`
- Frontend: `frontend:3000`

### Volumes

**postgres_data**:
- Type: Named volume
- Purpose: Persistent database storage
- Location: `/var/lib/postgresql/data` (inside container)
- Persistence: Data survives container restarts

**Bind Mounts**:
- `./backend/migrations:/docker-entrypoint-initdb.d`: Auto-run migrations
- `./frontend/public/assets:/app/frontend/public/assets:ro`: Static assets (read-only)
- `./backend/tests/price2568.pdf:/app/tests/price2568.pdf:ro`: Test PDF (read-only)

---

## Environment Variables

### Database Environment Variables

```bash
POSTGRES_DB=carjai
POSTGRES_USER=carjai_user
POSTGRES_PASSWORD=your_password
```

### Backend Environment Variables

**Database Connection**:
```bash
DB_HOST=database
DB_PORT=5432
DB_NAME=carjai
DB_USER=carjai_user
DB_PASSWORD=your_password
DB_SSLMODE=disable
```

**JWT Configuration**:
```bash
USER_JWT_SECRET=your_user_jwt_secret
USER_JWT_EXPIRATION_HOURS=24
USER_JWT_ISSUER=carjai
ADMIN_JWT_SECRET=your_admin_jwt_secret
ADMIN_JWT_EXPIRATION_HOURS=24
ADMIN_JWT_ISSUER=carjai-admin
```

**Admin Configuration**:
```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin_password
ADMIN_NAME=Administrator
ADMIN_ROUTE_PREFIX=/admin
ADMIN_IP_WHITELIST=127.0.0.1
```

**Application**:
```bash
PORT=8080
ENVIRONMENT=development
CORS_ALLOWED_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8080
```

**External Services**:
```bash
AIGEN_API_KEY=your_aigen_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8080/api/auth/google/callback
```

**Email (SMTP)**:
```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your_smtp_username
SMTP_PASSWORD=your_smtp_password
SMTP_FROM=noreply@carjai.com
```

**Password Reset**:
```bash
PASSWORD_RESET_JWT_SECRET=your_password_reset_secret
PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES=60
```

### Frontend Environment Variables

```bash
NODE_ENV=production
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**Note**: Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

---

## Health Checks

### Database Health Check

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
  interval: 10s
  timeout: 5s
  retries: 3
  start_period: 10s
```

**Purpose**: Ensures PostgreSQL is ready to accept connections

### Backend Health Check

```yaml
healthcheck:
  test: ["CMD-SHELL", "wget --tries=1 --spider http://localhost:8080/health || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**Purpose**: Checks if backend API is responding

**Endpoint**: `GET /health`

### Frontend Health Check

```yaml
healthcheck:
  test: ["CMD-SHELL", "wget --tries=1 --spider http://localhost:3000 || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**Purpose**: Checks if frontend web server is responding

### Health Check Status

View health status:
```bash
docker compose ps
```

Output shows health status:
- `healthy`: Service is healthy
- `unhealthy`: Service failed health check
- `starting`: Service is starting up

---

## Common Docker Commands

### Starting Services

**Start all services**:
```bash
docker compose up -d
```

**Start specific service**:
```bash
docker compose up -d database
docker compose up -d backend
docker compose up -d frontend
```

**Start with build**:
```bash
docker compose up -d --build
```

### Stopping Services

**Stop all services**:
```bash
docker compose down
```

**Stop and remove volumes**:
```bash
docker compose down -v
```

**Stop specific service**:
```bash
docker compose stop backend
```

### Viewing Logs

**View all logs**:
```bash
docker compose logs -f
```

**View specific service logs**:
```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f database
```

**View last N lines**:
```bash
docker compose logs --tail=100 backend
```

### Executing Commands

**Execute command in backend container**:
```bash
docker exec -it carjai-backend sh
docker exec -it carjai-backend go test ./...
```

**Execute command in frontend container**:
```bash
docker exec -it carjai-frontend sh
docker exec -it carjai-frontend npm run lint
```

**Execute command in database container**:
```bash
docker exec -it carjai-database psql -U carjai_user -d carjai
```

### Rebuilding Images

**Rebuild specific service**:
```bash
docker compose build backend
docker compose build frontend
```

**Rebuild without cache**:
```bash
docker compose build --no-cache backend
```

**Rebuild and restart**:
```bash
docker compose up -d --build backend
```

### Managing Volumes

**List volumes**:
```bash
docker volume ls
```

**Inspect volume**:
```bash
docker volume inspect carjai_postgres_data
```

**Remove volume** (⚠️ deletes data):
```bash
docker volume rm carjai_postgres_data
```

### Container Management

**List running containers**:
```bash
docker compose ps
```

**View container status**:
```bash
docker ps
```

**Inspect container**:
```bash
docker inspect carjai-backend
```

**View container resource usage**:
```bash
docker stats
```

### Network Management

**List networks**:
```bash
docker network ls
```

**Inspect network**:
```bash
docker network inspect carjai_carjai-network
```

---

## Troubleshooting

### Common Issues

**Port already in use**:
```bash
# Check what's using the port
lsof -i :8080
lsof -i :3000
lsof -i :5432

# Kill process or change port in docker-compose.yml
```

**Container won't start**:
```bash
# Check logs
docker compose logs backend

# Check health status
docker compose ps

# Restart service
docker compose restart backend
```

**Database connection errors**:
```bash
# Check database is running
docker compose ps database

# Check database logs
docker compose logs database

# Test connection
docker exec -it carjai-database psql -U carjai_user -d carjai
```

**Build failures**:
```bash
# Rebuild without cache
docker compose build --no-cache backend

# Check build logs
docker compose build backend
```

**Volume permission issues**:
```bash
# Check volume ownership
docker volume inspect carjai_postgres_data

# Remove and recreate volume (⚠️ data loss)
docker compose down -v
docker compose up -d
```

**Network connectivity issues**:
```bash
# Check network
docker network inspect carjai_carjai-network

# Restart all services
docker compose restart
```

### Debugging Commands

**Enter container shell**:
```bash
docker exec -it carjai-backend sh
docker exec -it carjai-frontend sh
```

**Check environment variables**:
```bash
docker exec -it carjai-backend env
```

**Check file permissions**:
```bash
docker exec -it carjai-backend ls -la /app
```

**Test service connectivity**:
```bash
# From backend, test database
docker exec -it carjai-backend wget -O- http://database:5432

# From frontend, test backend
docker exec -it carjai-frontend wget -O- http://backend:8080/health
```

### Cleanup

**Remove all containers, networks, and volumes**:
```bash
docker compose down -v
```

**Remove unused images**:
```bash
docker image prune -a
```

**Remove unused volumes**:
```bash
docker volume prune
```

**Full cleanup** (⚠️ removes everything):
```bash
docker system prune -a --volumes
```

---

## Additional Resources

- **Developer Documentation**: `docs/Developer-Documentation.md`
- **System Documentation**: `docs/System-Documentation.md`
- **Docker Compose Reference**: https://docs.docker.com/compose/
- **Dockerfile Best Practices**: https://docs.docker.com/develop/develop-images/dockerfile_best-practices/

---

**Last Updated**: 2024

