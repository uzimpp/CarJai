# API Documentation

Overview of the CarJai REST API. For complete endpoint reference, see [Swagger Documentation](#swagger-documentation).

---

## Table of Contents

1. [Base URL](#base-url)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Swagger Documentation](#swagger-documentation)

---

## Base URL

**Development**: `http://localhost:8080`

**Production**: (Configure based on deployment)

All API endpoints are prefixed with `/api/` except health check (`/health`).

---

## Authentication

CarJai uses dual JWT authentication systems: one for regular users and one for administrators.

### User Authentication

**Method**: Cookie-based JWT tokens

**How it works**:
1. User signs in via `/api/auth/signin` or `/api/auth/google/signin`
2. Server returns JWT token in HTTP-only cookie
3. Client includes cookie in subsequent requests automatically
4. Server validates token on protected endpoints

**Supported Methods**:
- Email/Username + Password
- Google OAuth (ID token or OAuth flow)

### Admin Authentication

**Method**: Cookie-based JWT tokens (separate from user tokens)

**IP Whitelist**: Admin endpoints require IP whitelist validation

**How it works**:
1. Admin signs in via `/api/admin/auth/signin` (from whitelisted IP)
2. Server returns admin JWT token in HTTP-only cookie
3. Client includes cookie in subsequent admin requests
4. Server validates token and IP address

### Google OAuth

**Two Methods Supported**:

1. **ID Token Sign-in**:
   - Client gets ID token from Google Identity Services
   - Client sends ID token to `/api/auth/google/signin`
   - Server validates token and creates/updates user
   - Server returns JWT token in cookie

2. **OAuth Flow**:
   - Client initiates flow via `/api/auth/google/start`
   - Server redirects to Google authorization page
   - User authorizes application
   - Google redirects to `/api/auth/google/callback` with code
   - Server exchanges code for ID token
   - Server validates ID token and creates/updates user
   - Server returns JWT token in cookie

### Password Reset

**How it works**:
1. User requests reset via `/api/auth/forgot-password` with email
2. Server sends reset link to email (if email exists)
3. User clicks link with token
4. User submits new password via `/api/auth/reset-password` with token
5. Server validates token and updates password
6. All user sessions are invalidated (force re-login)

**Alternative**: Direct ID token sign-in is also supported

---

## Response Format

All API responses follow a consistent JSON format:

### Success Response

```json
{
  "success": true,
  "code": 200,
  "message": "Optional success message",
  "data": {
    // Response data here
  }
}
```

### Error Response

```json
{
  "success": false,
  "code": 400,
  "message": "Error message describing what went wrong"
}
```

### HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or invalid
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource or conflict
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

---

## Error Handling

### Standard Error Format

All errors return JSON with:
- `success: false`
- `code`: HTTP status code
- `message`: Human-readable error message

### Common Error Scenarios

**Authentication Errors**:
```json
{
  "success": false,
  "code": 401,
  "message": "Invalid email or password"
}
```

**Validation Errors**:
```json
{
  "success": false,
  "code": 400,
  "message": "Username already exists"
}
```

**Not Found Errors**:
```json
{
  "success": false,
  "code": 404,
  "message": "Car not found"
}
```

**Rate Limit Errors**:
```json
{
  "success": false,
  "code": 429,
  "message": "Rate limit exceeded. Please try again later."
}
```

---

## Rate Limiting

API endpoints are protected by rate limiting to prevent abuse.

**Limits**:
- General endpoints: Configurable per endpoint
- Authentication endpoints: Stricter limits
- Admin endpoints: Stricter limits

**Response**: When rate limit is exceeded, API returns `429 Too Many Requests` status code.

---

## Swagger Documentation

Complete API documentation is available in Swagger/OpenAPI 3.0 format.

### Online SwaggerHub

View interactive API documentation at:
[https://app.swaggerhub.com/apis-docs/noneno/carjai-api/1.0.0](https://app.swaggerhub.com/apis-docs/noneno/carjai-api/1.0.0)

### GitHub

View the Swagger YAML file:
[https://github.com/uzimpp/CarJai/blob/main/backend/docs/swagger.yaml](https://github.com/uzimpp/CarJai/blob/main/backend/docs/swagger.yaml)

### Local

If running locally, the Swagger file is located at:
`backend/docs/swagger.yaml`

You can use tools like Swagger UI or Postman to import and test the API.

---

## Additional Resources

- **Backend README**: `backend/README.md`
- **Database Schema**: `backend/docs/schema.md`
- **Swagger Documentation**: `backend/docs/swagger.yaml`
- **Project README**: `README.md`

---
