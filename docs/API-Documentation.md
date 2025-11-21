# API Documentation

Complete reference for the CarJai REST API, including endpoints, authentication, request/response formats, and error handling.

---

## Table of Contents

1. [Base URL](#base-url)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Endpoints](#endpoints)
7. [Swagger Documentation](#swagger-documentation)

---

## Base URL

**Development**: `http://localhost:8080`

**Production**: (Configure based on deployment)

All API endpoints are prefixed with `/api/` except admin endpoints (`/admin/`) and health check (`/health`).

---

## Authentication

CarJai uses dual JWT authentication systems: one for regular users and one for administrators.

### User Authentication

**Method**: Cookie-based JWT tokens

**Endpoints**:
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Sign in with email/password
- `POST /api/auth/google/signin` - Sign in with Google ID token
- `GET /api/auth/google/start` - Start Google OAuth flow
- `GET /api/auth/google/callback` - Google OAuth callback
- `POST /api/auth/signout` - Sign out
- `POST /api/auth/password-reset/request` - Request password reset
- `POST /api/auth/password-reset/verify` - Verify password reset token
- `POST /api/auth/password-reset/reset` - Reset password

**How it works**:
1. User signs in via `/api/auth/signin` or `/api/auth/google/signin`
2. Server returns JWT token in HTTP-only cookie
3. Client includes cookie in subsequent requests automatically
4. Server validates token on protected endpoints

### Admin Authentication

**Method**: Cookie-based JWT tokens (separate from user tokens)

**Endpoints**:
- `POST /admin/auth/signin` - Admin sign in
- `POST /admin/auth/signout` - Admin sign out

**IP Whitelist**: Admin endpoints require IP whitelist validation

**How it works**:
1. Admin signs in via `/admin/auth/signin` (from whitelisted IP)
2. Server returns admin JWT token in HTTP-only cookie
3. Client includes cookie in subsequent admin requests
4. Server validates token and IP address

### Google OAuth

**Flow**:
1. Client calls `GET /api/auth/google/start` to initiate OAuth
2. Server redirects to Google authorization page
3. User authorizes application
4. Google redirects to `GET /api/auth/google/callback` with authorization code
5. Server exchanges code for ID token
6. Server validates ID token and creates/updates user
7. Server returns JWT token in cookie

**Alternative**: Direct ID token sign-in via `POST /api/auth/google/signin`

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

## Endpoints

### Health Check

#### `GET /health`

Check system health and database connectivity.

**Authentication**: Not required

**Response**:
```json
{
  "success": true,
  "code": 200,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0.0",
    "services": {
      "database": {
        "status": "healthy",
        "response_time": "5ms"
      }
    },
    "uptime": "24h30m15s"
  }
}
```

---

### User Authentication

#### `POST /api/auth/signup`

Create a new user account.

**Authentication**: Not required

**Request Body**:
```json
{
  "username": "user123",
  "email": "user@example.com",
  "password": "secure_password",
  "name": "John Doe"
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "code": 201,
  "message": "User created successfully"
}
```

#### `POST /api/auth/signin`

Sign in with email and password.

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response**: `200 OK` (JWT token in cookie)

#### `POST /api/auth/google/signin`

Sign in with Google ID token.

**Authentication**: Not required

**Request Body**:
```json
{
  "id_token": "google_id_token_here"
}
```

**Response**: `200 OK` (JWT token in cookie)

---

### User Profile

#### `GET /api/profile`

Get current user's profile.

**Authentication**: Required (User JWT)

**Response**: `200 OK`
```json
{
  "success": true,
  "code": 200,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "user123",
      "name": "John Doe"
    },
    "roles": ["buyer", "seller"],
    "profiles": {
      "buyer": { ... },
      "seller": { ... }
    }
  }
}
```

#### `PUT /api/profile`

Update user profile.

**Authentication**: Required (User JWT)

**Request Body**:
```json
{
  "name": "John Updated"
}
```

**Response**: `200 OK`

---

### Cars

#### `GET /api/cars/search`

Search and filter cars.

**Authentication**: Not required

**Query Parameters**:
- `brand` - Filter by brand
- `model` - Filter by model
- `year_min` - Minimum year
- `year_max` - Maximum year
- `price_min` - Minimum price
- `price_max` - Maximum price
- `province` - Filter by province
- `body_type` - Filter by body type
- `transmission` - Filter by transmission
- `fuel_type` - Filter by fuel type
- `page` - Page number (pagination)
- `limit` - Items per page

**Response**: `200 OK`
```json
{
  "success": true,
  "code": 200,
  "data": {
    "cars": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

#### `GET /api/cars/{id}`

Get car details by ID.

**Authentication**: Not required (seller contact info requires authentication)

**Response**: `200 OK`
```json
{
  "success": true,
  "code": 200,
  "data": {
    "car": { ... },
    "images": [ ... ],
    "inspection": { ... },
    "seller": { ... }
  }
}
```

#### `POST /api/cars`

Create a new car listing.

**Authentication**: Required (User JWT, must be seller)

**Request Body**: (Multipart form data)
- Car information fields
- Images (multiple files)
- Inspection certificate (file)
- Registration book (file, optional)

**Response**: `201 Created`

#### `PUT /api/cars/{id}`

Update car listing.

**Authentication**: Required (User JWT, must be owner)

**Response**: `200 OK`

#### `DELETE /api/cars/{id}`

Delete car listing.

**Authentication**: Required (User JWT, must be owner)

**Response**: `200 OK`

---

### Favourites

#### `GET /api/favorites`

Get user's favourite cars.

**Authentication**: Required (User JWT)

**Response**: `200 OK`
```json
{
  "success": true,
  "code": 200,
  "data": {
    "favorites": [ ... ]
  }
}
```

#### `POST /api/favorites`

Add car to favourites.

**Authentication**: Required (User JWT)

**Request Body**:
```json
{
  "car_id": 123
}
```

**Response**: `201 Created`

#### `DELETE /api/favorites/{car_id}`

Remove car from favourites.

**Authentication**: Required (User JWT)

**Response**: `200 OK`

---

### Recent Views

#### `GET /api/recent-views`

Get user's recent viewing history.

**Authentication**: Required (User JWT)

**Response**: `200 OK`
```json
{
  "success": true,
  "code": 200,
  "data": {
    "recent_views": [ ... ]
  }
}
```

#### `POST /api/recent-views`

Track car view (automatically called when viewing car details).

**Authentication**: Required (User JWT)

**Request Body**:
```json
{
  "car_id": 123
}
```

**Response**: `201 Created`

---

### Reports

#### `GET /api/reports`

Get user's reports.

**Authentication**: Required (User JWT)

**Response**: `200 OK`
```json
{
  "success": true,
  "code": 200,
  "data": {
    "reports": [ ... ]
  }
}
```

#### `POST /api/reports`

Create a new report.

**Authentication**: Required (User JWT)

**Request Body**:
```json
{
  "report_type": "car",
  "car_id": 123,
  "topic": "False Information",
  "sub_topics": ["Wrong mileage", "Fake photos"],
  "description": "Detailed description of the issue"
}
```

**Response**: `201 Created`

---

### Admin Endpoints

All admin endpoints are prefixed with `/admin/` and require:
1. Admin JWT authentication
2. IP whitelist validation

#### Admin Dashboard

- `GET /admin/dashboard` - Get dashboard statistics

#### Admin Users

- `GET /admin/users` - List all users
- `GET /admin/users/{id}` - Get user details
- `PUT /admin/users/{id}/ban` - Ban user
- `PUT /admin/users/{id}/unban` - Unban user

#### Admin Cars

- `GET /admin/cars` - List all cars
- `GET /admin/cars/{id}` - Get car details
- `PUT /admin/cars/{id}` - Update car
- `DELETE /admin/cars/{id}` - Delete car

#### Admin Reports

- `GET /admin/reports` - List all reports
- `GET /admin/reports/{id}` - Get report details
- `PUT /admin/reports/{id}` - Update report status

#### Admin IP Whitelist

- `GET /admin/ip-whitelists` - List all whitelisted IPs
- `POST /admin/ip-whitelists` - Add IP to whitelist
- `DELETE /admin/ip-whitelists/{id}` - Remove IP from whitelist

#### Admin Market Price

- `GET /admin/market-price` - List market prices
- `POST /admin/market-price/upload` - Upload DLT PDF

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
- **Project README**: `README.md`

---

**Last Updated**: 2024

