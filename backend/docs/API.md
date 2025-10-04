# CarJai API Documentation

Complete API reference for the CarJai platform featuring dual authentication, document verification, and system monitoring.

## 🔗 Base URLs

- **Development:** `http://localhost:8080`
- **Production:** `https://api.carjai.com`

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) stored in HTTP cookies for authentication. The system automatically handles cookie management:

- **User Authentication**: Uses `jwt` cookie
- **Admin Authentication**: Uses `admin_jwt` cookie
- **Cookie Security**: HttpOnly, SameSite protection, configurable Secure flag

## 📡 API Endpoints

### Admin Authentication

#### POST `/admin/auth/signin`
Admin sign in with IP whitelist validation

**Request:**
```json
{
  "username": "your_admin_username",
  "password": "your_admin_password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "admin": {
      "id": 1,
      "username": "your_admin_username",
      "name": "System Administrator",
      "last_signin_at": "2024-01-01T10:00:00Z",
      "created_at": "2024-01-01T09:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2024-01-01T18:00:00Z"
  },
  "message": "Sign in successful"
}
```

#### POST `/admin/auth/signout`
Admin sign out

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### GET `/admin/auth/me`
Get current admin information

**Authentication:** Uses `admin_jwt` cookie (automatically sent by browser)

#### POST `/admin/auth/refresh`
Refresh admin authentication token

**Authentication:** Uses `admin_jwt` cookie (automatically sent by browser)

### User Authentication

#### POST `/api/auth/signup`
User registration

**Request:**
```json
{
  "username": "user123",
  "email": "user@example.com",
  "password": "secure_password",
  "name": "John Doe"
}
```

#### POST `/api/auth/signin`
User sign in

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

#### POST `/api/auth/signout`
User sign out

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### GET `/api/auth/me`
Get current user information

**Authentication:** Uses `jwt` cookie (automatically sent by browser)

#### POST `/api/auth/refresh`
Refresh user authentication token

**Authentication:** Uses `jwt` cookie (automatically sent by browser)

### Document Verification

#### POST `/api/ocr/verify-document`
Verify document using OCR

**Headers:**
```
Content-Type: multipart/form-data
```

**Authentication:** Uses `jwt` cookie (automatically sent by browser)

**Request:**
```
file: [document file]
document_type: "id_card" | "driver_license" | "vehicle_registration"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "document_type": "id_card",
    "extracted_data": {
      "name": "John Doe",
      "id_number": "1234567890123",
      "issue_date": "2020-01-01",
      "expiry_date": "2030-01-01"
    },
    "confidence_score": 0.95,
    "verification_status": "verified"
  },
  "message": "Document verified successfully"
}
```

### IP Whitelist Management

#### GET `/admin/ip-whitelist`
View whitelisted IP addresses

**Authentication:** Uses `admin_jwt` cookie (automatically sent by browser)

#### POST `/admin/ip-whitelist/add`
Add IP address to whitelist

**Authentication:** Uses `admin_jwt` cookie (automatically sent by browser)

**Request:**
```json
{
  "ip_address": "10.0.0.100/32",
  "description": "Office IP"
}
```

#### DELETE `/admin/ip-whitelist/remove?ip=10.0.0.100/32`
Remove IP address from whitelist

**Authentication:** Uses `admin_jwt` cookie (automatically sent by browser)

### Health & Monitoring

#### GET `/health`
Basic health check

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T10:00:00Z",
  "version": "1.0.0",
  "services": {
    "database": {
      "status": "healthy",
      "response_time": "5ms"
    }
  },
  "uptime": "1h30m45s"
}
```

#### GET `/admin/health`
Admin system health check

#### GET `/metrics`
System metrics

## 📝 Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message",
  "code": 400
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **IP Whitelist** - Admin access restricted by IP addresses
- **Rate Limiting** - Prevents brute force attacks
- **CORS Protection** - Configurable cross-origin policies
- **Input Validation** - All inputs are validated and sanitized

## 📊 Rate Limits

- **Authentication endpoints:** 5 requests per 15 minutes
- **General API:** 100 requests per minute
- **Document upload:** 10 requests per hour

## 🧪 Testing the API

### Using curl with cookies

```bash
# Test admin sign in (saves cookie to file)
curl -X POST http://localhost:8080/admin/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"myadmin","password":"your_password"}' \
  -c cookies.txt

# Test admin endpoint using saved cookie
curl -X GET http://localhost:8080/admin/auth/me \
  -b cookies.txt

# Test user registration (saves cookie to file)
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"user123","email":"user@example.com","password":"password123","name":"John Doe"}' \
  -c user_cookies.txt

# Test user endpoint using saved cookie
curl -X GET http://localhost:8080/api/auth/me \
  -b user_cookies.txt

# Test health check (no authentication required)
curl http://localhost:8080/health
```

### Using browser developer tools

1. Open browser developer tools (F12)
2. Go to Application/Storage tab
3. Check Cookies section to see `jwt` and `admin_jwt` cookies
4. Use Network tab to see cookie headers in requests
