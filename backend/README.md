# CarJai Backend - Admin Authentication System

Admin Authentication System for CarJai with IP whitelist and JWT token authentication

## 🚀 Features

- **Admin Authentication** - Username/password login
- **JWT Token System** - Secure token-based authentication
- **IP Whitelist** - Restrict access based on IP addresses
- **Session Management** - Session management with auto-cleanup
- **Security Headers** - CORS, XSS protection, and security headers
- **Audit Logging** - Log admin access activities

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

### 1. Database Setup

```bash
# Run migration
psql -h localhost -U postgres -d carjai -f migrations/001_admin_auth.sql
```

### 2. Environment Variables

Create `.env` file from `env.example`:

```bash
cp env.example .env
```

Edit values in `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=carjai
JWT_SECRET=your-very-long-secret-key
```

### 3. Run Application

```bash
# Development
go run main.go

# Or using Docker
docker build -t carjai-backend .
docker run -p 8080:8080 carjai-backend
```

## 🔐 Default Admin Account

After running migration:

- **Username:** `admin`
- **Password:** `admin123`
- **IP Whitelist:** `127.0.0.1/32`, `::1/128`

⚠️ **Change password in production!**

## 🏗️ Project Structure

```
backend/
├── config/           # Configuration files
├── handlers/         # HTTP handlers
├── middleware/       # Middleware functions
├── migrations/       # Database migrations
├── models/           # Data models and database operations
├── routes/           # Route definitions
├── services/         # Business logic
├── utils/            # Utility functions
├── main.go           # Application entry point
└── go.mod            # Go dependencies
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
# Test login
curl -X POST http://localhost:8080/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test protected endpoint
curl -X GET http://localhost:8080/admin/auth/me \
  -H "Authorization: Bearer <token>"
```