# Docker Documentation

Quick guide to Docker setup, running services, and troubleshooting for the CarJai platform.

---

## Table of Contents

1. [Structure](#structure)
2. [How to Run](#how-to-run)
3. [Health Checks](#health-checks)
4. [Common Issues](#common-issues)

---

## Structure

### Services

1. **database** - PostgreSQL 15 (Alpine) on port `5432`
2. **backend** - Go HTTP API server on port `8080`
3. **frontend** - Next.js 14 application on port `3000`

All services communicate via `carjai-network` Docker bridge network.

---

## How to Run

### Prerequisites

1. Install Docker and Docker Compose
2. Copy `env.example` to `.env` and configure

### Starting Services

```bash
# Start all services
docker compose up -d

# Start with rebuild
docker compose up -d --build

# View logs
docker compose logs -f
docker compose logs -f backend
```

### Stopping Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes (⚠️ deletes database data)
docker compose down -v
```

### Accessing Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Database**: localhost:5432

---

## Health Checks

### Check Service Status

```bash
docker compose ps
```

Status values: `healthy`, `unhealthy`, `starting`

### Manual Health Checks

```bash
# Backend health endpoint
curl http://localhost:8080/health

# Frontend
curl http://localhost:3000

# Database
docker exec -it carjai-database pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}
```

### Health Check Configuration

- **Database**: `pg_isready` command, interval 10s
- **Backend**: `GET /health` endpoint, interval 30s
- **Frontend**: HTTP request to port 3000, interval 30s

---

## Common Issues

### Port Already in Use

```bash
# Check what's using the port
lsof -i :8080
lsof -i :3000
lsof -i :5432

# Stop Docker containers
docker compose down
```

### Container Won't Start

```bash
# Check logs
docker compose logs backend

# Check health status
docker compose ps

# Rebuild and restart
docker compose up -d --build backend
```

### Database Connection Errors

```bash
# Check database is running
docker compose ps database

# Check database logs
docker compose logs database

# Test connection
docker exec -it carjai-database psql -U carjai_user -d carjai

# Verify environment variables
docker exec -it carjai-backend env | grep DB_
```

### Build Failures

```bash
# Rebuild without cache
docker compose build --no-cache backend

# Clean build
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Frontend Can't Connect to Backend

```bash
# Check backend is running
docker compose ps backend
curl http://localhost:8080/health

# Check environment variables
docker exec -it carjai-frontend env | grep NEXT_PUBLIC

# Restart services
docker compose restart backend frontend
```

### Quick Troubleshooting

```bash
# View all service status
docker compose ps

# View all logs
docker compose logs -f

# Restart all services
docker compose restart

# Rebuild and restart everything
docker compose down
docker compose up -d --build

# Clean everything (⚠️ deletes data)
docker compose down -v
docker system prune -a
docker compose up -d --build
```

---

## Additional Resources

- **Developer Documentation**: `docs/Developer-Documentation.md`
- **System Documentation**: `docs/System-Documentation.md`

---
