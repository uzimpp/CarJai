# CarJai Backend Deployment Guide

Deployment guide for CarJai Admin Authentication system

## 📋 Prerequisites

- Docker and Docker Compose
- PostgreSQL database
- Go 1.24.3+ (for development)
- Git

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd CarJai/backend
```

### 2. Environment Setup

```bash
# Copy environment template
cp env.example .env

# Edit environment variables
nano .env
```

### 3. Database Setup

```bash
# Start PostgreSQL (using Docker)
docker run --name carjai-db \
  -e POSTGRES_DB=carjai \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15

# Run migrations
psql -h localhost -U postgres -d carjai -f migrations/001_admin_auth.sql
```

### 4. Run Application

```bash
# Development
go run main.go

# Or using Docker
docker build -t carjai-backend .
docker run -p 8080:8080 carjai-backend
```

## 🐳 Docker Deployment

### Single Container

```bash
# Build image
docker build -t carjai-backend .

# Run container
docker run -d \
  --name carjai-backend \
  -p 8080:8080 \
  -e DB_HOST=host.docker.internal \
  -e DB_PASSWORD=your_password \
  -e JWT_SECRET=your-secret-key \
  carjai-backend
```

### Docker Compose

Create `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - DB_HOST=db
      - DB_PORT=5432
      - DB_USER=postgres
      - DB_PASSWORD=password
      - DB_NAME=carjai
      - JWT_SECRET=your-very-long-secret-key
      - ENVIRONMENT=production
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=carjai
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:
```

Run with:

```bash
docker-compose up -d
```

## 🔧 Production Configuration

### Environment Variables

```env
# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=strong-password
DB_NAME=carjai
DB_SSLMODE=require

# Application
PORT=8080
ENVIRONMENT=production

# JWT
JWT_SECRET=your-very-long-secret-key-at-least-32-characters
JWT_EXPIRATION_HOURS=8

# Admin Routes
ADMIN_ROUTE_PREFIX=/admin
```

### Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT secret key
- [ ] Enable SSL/TLS for database
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Configure log rotation
- [ ] Enable monitoring and alerting

### Database Security

```sql
-- Create dedicated user for application
CREATE USER carjai_app WITH PASSWORD 'strong-password';
GRANT CONNECT ON DATABASE carjai TO carjai_app;
GRANT USAGE ON SCHEMA public TO carjai_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO carjai_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO carjai_app;
```

## 📊 Monitoring and Logging

### Health Checks

```bash
# Basic health check
curl http://localhost:8080/health

# Admin health check
curl http://localhost:8080/admin/health

# Metrics
curl http://localhost:8080/metrics
```

### Log Monitoring

```bash
# View logs
docker logs carjai-backend

# Follow logs
docker logs -f carjai-backend

# View structured logs
docker logs carjai-backend | jq .
```

### Performance Monitoring

```bash
# Check database connections
psql -h localhost -U postgres -d carjai -c "
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE datname = 'carjai';"

# Check active sessions
psql -h localhost -U postgres -d carjai -c "
SELECT count(*) as active_sessions 
FROM admin_sessions 
WHERE expires_at > NOW();"
```

## 🔄 Backup and Recovery

### Database Backup

```bash
# Full backup
pg_dump -h localhost -U postgres carjai > backup_$(date +%Y%m%d_%H%M%S).sql

# Schema only
pg_dump -h localhost -U postgres -s carjai > schema_backup.sql

# Data only
pg_dump -h localhost -U postgres -a carjai > data_backup.sql
```

### Database Restore

```bash
# Restore from backup
psql -h localhost -U postgres carjai < backup_20240101_120000.sql

# Restore schema
psql -h localhost -U postgres carjai < schema_backup.sql

# Restore data
psql -h localhost -U postgres carjai < data_backup.sql
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Failed

```bash
# Check database status
docker ps | grep postgres

# Check database logs
docker logs carjai-db

# Test connection
psql -h localhost -U postgres -d carjai -c "SELECT 1;"
```

#### 2. JWT Token Issues

```bash
# Check JWT secret
echo $JWT_SECRET

# Verify token format
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." | base64 -d
```

#### 3. IP Whitelist Issues

```bash
# Check whitelisted IPs
psql -h localhost -U postgres -d carjai -c "
SELECT ip_address, description 
FROM admin_ip_whitelist 
WHERE admin_id = 1;"

# Test IP validation
curl -H "X-Real-IP: 10.0.0.100" http://localhost:8080/admin/auth/me
```

### Performance Issues

#### 1. High Memory Usage

```bash
# Check memory usage
docker stats carjai-backend

# Check database connections
psql -h localhost -U postgres -d carjai -c "
SELECT count(*) FROM pg_stat_activity;"
```

#### 2. Slow Queries

```bash
# Check slow queries
psql -h localhost -U postgres -d carjai -c "
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;"
```

## 📈 Scaling

### Horizontal Scaling

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    deploy:
      replicas: 3
    environment:
      - DB_HOST=db
      - DB_PASSWORD=password
      - JWT_SECRET=your-secret-key
    depends_on:
      - db
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app
```

### Load Balancer Configuration

```nginx
# nginx.conf
upstream carjai_backend {
    server app_1:8080;
    server app_2:8080;
    server app_3:8080;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://carjai_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 🔐 Security Hardening

### 1. Network Security

```bash
# Firewall rules
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw deny 5432/tcp  # PostgreSQL (internal only)
ufw enable
```

### 2. SSL/TLS

```bash
# Generate SSL certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Update docker-compose.yml
services:
  app:
    volumes:
      - ./cert.pem:/app/cert.pem
      - ./key.pem:/app/key.pem
    environment:
      - SSL_CERT=/app/cert.pem
      - SSL_KEY=/app/key.pem
```

### 3. Rate Limiting

```bash
# Check rate limit logs
docker logs carjai-backend | grep "Rate limit"

# Monitor failed login attempts
docker logs carjai-backend | grep "Failed login"
```

## 📞 Support

If you encounter issues or need assistance:

1. Check logs: `docker logs carjai-backend`
2. Check health status: `curl http://localhost:8080/health`
3. Check database connection
4. Check environment variables
5. Contact development team

---

**Note:** This guide is for production deployment. Please customize according to your environment.
