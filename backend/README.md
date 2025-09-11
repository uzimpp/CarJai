# CarJai Backend - Admin Authentication System

A robust, production-ready admin authentication system for CarJai with comprehensive security features, built with Go and PostgreSQL.

## 🚀 Features

- **🔐 Admin Authentication** - Secure username/password login with bcrypt hashing
- **🎫 JWT Token System** - Stateless token-based authentication with configurable expiration
- **🛡️ IP Whitelist** - Restrict admin access based on IP addresses and CIDR ranges
- **📊 Session Management** - Automatic session cleanup and management
- **🔒 Security Headers** - CORS, XSS protection, HSTS, and comprehensive security headers
- **📝 Audit Logging** - Detailed logging of admin access activities and security events

## 📋 API Endpoints

### Authentication Endpoints

#### POST `/admin/auth/login`
Admin login

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "admin": {
      "id": 1,
      "username": "admin",
      "name": "System Administrator",
      "last_login_at": "2024-01-01T10:00:00Z",
      "created_at": "2024-01-01T09:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2024-01-01T18:00:00Z"
  },
  "message": "Login successful"
}
```

#### POST `/admin/auth/logout`
Logout from system

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### GET `/admin/auth/me`
Get current admin information

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "admin": {
      "id": 1,
      "username": "admin",
      "name": "System Administrator",
      "last_login_at": "2024-01-01T10:00:00Z",
      "created_at": "2024-01-01T09:00:00Z"
    },
    "session": {
      "ip_address": "127.0.0.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2024-01-01T10:00:00Z",
      "expires_at": "2024-01-01T18:00:00Z"
    }
  }
}
```

#### POST `/admin/auth/refresh`
Refresh authentication token

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2024-01-01T18:00:00Z",
  "message": "Token refreshed successfully"
}
```

### IP Whitelist Management

#### GET `/admin/ip-whitelist`
View whitelisted IP addresses

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "admin_id": 1,
      "ip_address": "127.0.0.1/32",
      "description": "Localhost",
      "created_at": "2024-01-01T09:00:00Z"
    }
  ]
}
```

#### POST `/admin/ip-whitelist/add`
Add IP address to whitelist

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "ip_address": "192.168.1.100/32",
  "description": "Office IP"
}
```

**Response:**
```json
{
  "success": true,
  "message": "IP address added to whitelist successfully"
}
```

#### DELETE `/admin/ip-whitelist/remove?ip=192.168.1.100/32`
Remove IP address from whitelist

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "IP address removed from whitelist successfully"
}
```

## 🛠️ Setup and Installation

### 1. Environment Setup

Create a `.env` file in the `backend/` directory with the following variables:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=<your_db_user>
DB_PASSWORD=<your_db_password>
DB_NAME=<your_db_name>

# Application Configuration
PORT=8080
JWT_SECRET=<your_jwt_secret_key> 
JWT_EXPIRATION_HOURS=8

# Admin Configuration
ADMIN_USERNAME=<admin_username>
ADMIN_PASSWORD=<admin_password>  
ADMIN_NAME=<admin_display_name>
ADMIN_ROUTE_PREFIX=/admin

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080

# PostgreSQL Configuration (for database service)
POSTGRES_PASSWORD=<postgres_root_password> 

# Additional required environment variables
ENVIRONMENT=development
ADMIN_IP_WHITELIST=127.0.0.1,::1 

# Database SSL Configuration
DB_SSLMODE=disable  # Set to 'verify-full' in production
```

### Configuration Validation

The application validates all configuration values on startup:
- **PORT**: Must be a valid port number (1-65535)
- **JWT_SECRET**: Must be at least 32 characters long
- **JWT_EXPIRATION_HOURS**: Must be between 1 and 168 hours (1 week max)
- **ADMIN_USERNAME**: Must contain only alphanumeric characters and underscores (3-50 chars)
- **ADMIN_PASSWORD**: Must be at least 8 characters long
- **ENVIRONMENT**: Must be one of: development, staging, production

### 2. Run with Docker Compose (Recommended)

```bash
# Start all services (database, backend, frontend)
docker compose up -d --build

# View logs
docker compose logs -f

# Stop services
docker compose down

# Clean restart (removes all data)
docker compose down -v
docker compose up -d --build
```

### 3. Manual Setup (Alternative)

```bash
# 1. Start PostgreSQL database
docker run -d --name carjai-db \
  -e POSTGRES_USER=carjai_user \
  -e POSTGRES_PASSWORD=carjai_password \
  -e POSTGRES_DB=carjai \
  -p 5432:5432 \
  postgres:15-alpine

# 2. Wait for database to be ready, then run migration
psql -h localhost -U carjai_user -d carjai -f migrations/001_admin_auth.sql

# 3. Run backend
go run main.go
```

## 🔐 Admin Account

The admin account is automatically created from environment variables:

- **Username:** Set via `ADMIN_USERNAME` (default: `root`)
- **Password:** Set via `ADMIN_PASSWORD` (default: `mypassword`)
- **Name:** Set via `ADMIN_NAME` (default: `myname`)
- **IP Whitelist:** Automatically includes localhost, Docker networks, and private networks

⚠️ **Change credentials in production by updating the `.env` file!**

## 🏗️ Project Structure

```
backend/
├── config/              # Configuration management
│   ├── app.go          # Application configuration
│   ├── database.go     # Database configuration
│   ├── env.go          # Environment variable helpers
│   └── validation.go   # Configuration validation
├── handlers/            # HTTP request handlers
│   ├── admin_auth.go   # Admin authentication handlers
│   ├── admin_ip.go     # IP whitelist handlers
│   └── health.go       # Health check handlers
├── middleware/          # HTTP middleware
│   ├── auth.go         # Authentication middleware
│   ├── cors.go         # CORS middleware
│   ├── logging.go      # Request logging middleware
│   └── rate_limit.go   # Rate limiting middleware
├── migrations/          # Database schema migrations
│   └── 001_admin_auth.sql
├── models/              # Data models and repositories
│   ├── admin.go        # Admin-related models
│   └── database.go     # Database connection and repositories
├── routes/              # Route definitions
│   ├── admin.go        # Admin routes
│   └── health.go       # Health check routes
├── services/            # Business logic services
│   ├── admin_service.go    # Admin business logic
│   ├── maintenance.go      # Background maintenance tasks
│   └── initialization.go   # Database initialization
├── types/               # Shared types and constants
│   └── common.go       # Common types and constants
├── utils/               # Utility functions
│   ├── ip.go           # IP address utilities
│   ├── jwt.go          # JWT token utilities
│   ├── logger.go       # Logging utilities
│   ├── password.go     # Password hashing utilities
│   └── response.go     # HTTP response helpers
├── tests/               # Test files
├── docs/                # Documentation
├── main.go              # Application entry point
└── go.mod               # Go dependencies
```

## 🔒 Security Features

- **JWT Tokens** - Secure token-based authentication
- **IP Whitelist** - Restrict access based on IP addresses
- **Password Hashing** - Bcrypt password hashing
- **Session Management** - Auto-cleanup expired sessions
- **Security Headers** - CORS, XSS protection
- **Audit Logging** - Log admin access activities

## 📝 Error Responses

```json
{
  "success": false,
  "error": "Error message",
  "code": 400
}
```

## 🧪 Testing

```bash
# Test login (using credentials from .env file)
curl -X POST http://localhost:8080/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"root","password":"mypassword"}'

# Test protected endpoint
curl -X GET http://localhost:8080/admin/auth/me \
  -H "Authorization: Bearer <token>"

# Test health endpoint
curl http://localhost:8080/health

# Test root endpoint
curl http://localhost:8080/
```
