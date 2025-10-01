# CarJai Backend

A production-ready Go backend for the CarJai platform featuring dual authentication, document verification, and advanced security.

## ✨ Features

- 🔐 **Dual Authentication** - Separate admin and user JWT systems with cookie-based auth
- 📄 **Document Verification** - AI-powered OCR using AIGEN API
- 🛡️ **Security** - IP whitelist, rate limiting, CORS protection
- 🏥 **Health Monitoring** - System health checks and metrics
- 📊 **Admin Management** - User management and system administration

## 🚀 Quick Start

### Prerequisites
- Go (>= 1.22)
- PostgreSQL (>= 15) or Docker
- Docker & Docker Compose (recommended)

### 1. Environment Setup
```bash
# Copy environment template
cp env.example .env

# Edit environment variables
nano .env
```

### 2. Run with Docker Compose
```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f backend
```

### 3. Manual Setup
```bash
# Start database
docker run -d --name carjai-db \
  -e POSTGRES_USER=carjai_user \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=carjai \
  -p 5432:5432 postgres:15-alpine

# Run backend
go mod tidy
go run main.go
```

## 📡 API Endpoints

### Admin Authentication
- `POST /admin/auth/signin` - Admin sign in
- `POST /admin/auth/signout` - Admin sign out
- `GET /admin/auth/me` - Get admin info
- `POST /admin/auth/refresh` - Refresh token

### User Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signout` - User sign out
- `GET /api/auth/me` - Get user info
- `POST /api/auth/refresh` - Refresh token

### Document Verification
- `POST /api/ocr/verify-document` - Document verification

### Health & Monitoring
- `GET /health` - Basic health check
- `GET /admin/health` - Admin system health
- `GET /metrics` - System metrics

## 🔧 Development

### Running Tests
```bash
# Run all tests
go test ./...

# Run with coverage
go test -cover ./...
```

### Building
```bash
# Build for current platform
go build -o carjai-backend main.go

# Build for Linux (Docker)
GOOS=linux GOARCH=amd64 go build -o carjai-backend main.go
```

## 📚 Documentation

- [API Documentation](docs/API.md) - Complete API reference
- [Setup Guide](docs/SETUP.md) - Detailed setup and configuration
- [Security Guide](docs/SECURITY.md) - Security features and best practices
- [Testing Guide](docs/TESTING.md) - How to test the backend

## 🏗️ Project Structure

```
backend/
├── config/          # Configuration management
├── handlers/        # HTTP request handlers
├── middleware/      # CORS, auth, rate limiting
├── models/          # Database models & repositories
├── routes/          # API route definitions
├── services/        # Business logic services
├── utils/           # Utility functions
├── migrations/      # Database schema migrations
├── tests/           # Test files
├── docs/            # Documentation
└── main.go          # Application entry point
```

## 🔐 Security Features

- **Cookie-based JWT Authentication** - Secure token-based authentication with HttpOnly cookies
- **IP Whitelist** - Admin access restricted by IP addresses
- **Password Hashing** - bcrypt with configurable cost
- **Rate Limiting** - Prevents brute force attacks
- **CORS Protection** - Configurable cross-origin policies
- **Input Validation** - All inputs validated and sanitized

## 🛠️ Configuration

### Required Environment Variables
```env
# Database
POSTGRES_DB=carjai
POSTGRES_USER=carjai_user
POSTGRES_PASSWORD=your_password

# JWT Secrets (minimum 32 characters)
USER_JWT_SECRET=your_user_jwt_secret_key_32_chars_minimum
ADMIN_JWT_SECRET=your_admin_jwt_secret_key_32_chars_minimum

# Admin Credentials
ADMIN_USERNAME=myadmin
ADMIN_PASSWORD=your_secure_admin_password

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## 🚨 Troubleshooting

### Common Issues

**Database Connection Failed:**
```bash
# Check if database is running
docker ps | grep postgres

# Test connection
psql -h localhost -U carjai_user -d carjai
```

**Port Already in Use:**
```bash
# Check what's using port 8080
lsof -i :8080

# Kill process
sudo kill -9 $(lsof -t -i:8080)
```

**Environment Variables Not Loaded:**
```bash
# Check if .env file exists in root directory
ls -la .env

# Check environment variables
env | grep DB_
env | grep JWT_
```

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details.
