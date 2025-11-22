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

All API endpoints are prefixed with `/api/` except health check (`/health`).

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
- `GET /api/auth/me` - Get current user information
- `POST /api/auth/signout` - Sign out
- `POST /api/auth/refresh` - Refresh authentication token
- `POST /api/auth/change-password` - Change user password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

**How it works**:
1. User signs in via `/api/auth/signin` or `/api/auth/google/signin`
2. Server returns JWT token in HTTP-only cookie
3. Client includes cookie in subsequent requests automatically
4. Server validates token on protected endpoints

### Admin Authentication

**Method**: Cookie-based JWT tokens (separate from user tokens)

**Endpoints**:
- `POST /api/admin/auth/signin` - Admin sign in
- `GET /api/admin/auth/me` - Get current admin information
- `POST /api/admin/auth/signout` - Admin sign out
- `POST /api/admin/auth/refresh` - Refresh admin authentication token

**IP Whitelist**: Admin endpoints require IP whitelist validation

**How it works**:
1. Admin signs in via `/api/admin/auth/signin` (from whitelisted IP)
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
    "timestamp": "2025-01-01T00:00:00Z",
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

#### `GET /api/auth/me`

Get current user information.

**Authentication**: Required (User JWT)

**Response**: `200 OK`

#### `POST /api/auth/signout`

Sign out current user.

**Authentication**: Required (User JWT)

**Response**: `200 OK`

#### `POST /api/auth/refresh`

Refresh user authentication token.

**Authentication**: Required (User JWT)

**Response**: `200 OK`

#### `POST /api/auth/change-password`

Change user password.

**Authentication**: Required (User JWT)

**Request Body**:
```json
{
  "current_password": "old_password",
  "new_password": "new_password"
}
```

**Response**: `200 OK`

#### `POST /api/auth/forgot-password`

Request password reset email.

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response**: `200 OK`

#### `POST /api/auth/reset-password`

Reset password with token.

**Authentication**: Not required

**Request Body**:
```json
{
  "token": "reset_token_here",
  "new_password": "new_secure_password"
}
```

**Response**: `200 OK`

---

### User Profile

#### `GET /api/profile/self`

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
    "roles": {
      "buyer": true,
      "seller": true
    },
    "profiles": {
      "buyerComplete": true,
      "sellerComplete": false
    }
  }
}
```

#### `PATCH /api/profile/self`

Update current user profile.

**Authentication**: Required (User JWT)

**Request Body**:
```json
{
  "username": "newusername",
  "name": "New Name",
  "buyer": {
    "province": "Bangkok",
    "budgetMin": 300000,
    "budgetMax": 1500000
  },
  "seller": {
    "displayName": "My Shop",
    "about": "About my shop",
    "contacts": [
      {
        "contactType": "phone",
        "value": "0812345678",
        "label": "Mobile"
      }
    ]
  }
}
```

**Response**: `200 OK`

#### `GET /api/profile/seller/{id}`

Get seller profile by ID (public endpoint).

**Authentication**: Not required

**Response**: `200 OK`
```json
{
  "success": true,
  "code": 200,
  "data": {
    "seller": {
      "id": 1,
      "displayName": "My Car Shop",
      "about": "Best cars in town"
    },
    "contacts": [ ... ],
    "cars": [ ... ]
  }
}
```

---

### Cars

#### `GET /api/cars/search`

Search and filter cars.

**Authentication**: Not required

**Query Parameters**:
- `q` - Search query (brand, model, description)
- `bodyType` - Filter by body type code
- `transmission` - Filter by transmission code
- `drivetrain` - Filter by drivetrain code
- `fuelTypes` - Filter by fuel type codes (array)
- `colors` - Filter by color codes (array)
- `provinceId` - Filter by province ID
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `minYear` - Minimum year
- `maxYear` - Maximum year
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Response**: `200 OK`
```json
{
  "success": true,
  "code": 200,
  "data": {
    "cars": [ ... ],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

#### `POST /api/cars`

Create a new car listing.

**Authentication**: Required (User JWT, must be seller)

**Request Body**: (JSON or Multipart form data)
- Car information fields
- Images (multiple files)
- Inspection certificate (file)
- Registration book (file, optional)

**Response**: `201 Created`

#### `GET /api/cars/my`

Get current user's cars.

**Authentication**: Required (User JWT)

**Query Parameters**:
- `lang` - Language preference (en, th, default: en)

**Response**: `200 OK`

#### `GET /api/cars/{id}`

Get car details by ID.

**Authentication**: Not required (seller contact info requires authentication)

**Query Parameters**:
- `lang` - Language preference (en, th, default: en)

**Response**: `200 OK`
```json
{
  "success": true,
  "code": 200,
  "data": {
    "car": { ... },
    "images": [ ... ],
    "inspection": { ... },
    "sellerContacts": [ ... ]
  }
}
```

#### `PUT /api/cars/{id}`

Update car listing.

**Authentication**: Required (User JWT, must be owner)

**Response**: `200 OK`

#### `DELETE /api/cars/{id}`

Delete car listing.

**Authentication**: Required (User JWT, must be owner)

**Response**: `200 OK`

#### `POST /api/cars/{id}/images`

Upload car images.

**Authentication**: Required (User JWT, must be owner)

**Request Body**: (Multipart form data)
- `images` - Array of image files

**Response**: `200 OK`

#### `PUT /api/cars/{id}/images/order`

Reorder car images.

**Authentication**: Required (User JWT, must be owner)

**Request Body**:
```json
{
  "imageIds": [1, 2, 3]
}
```

**Response**: `200 OK`

#### `GET /api/cars/images/{image_id}`

Get car image.

**Authentication**: Not required

**Response**: `200 OK` (image binary)

#### `DELETE /api/cars/images/{image_id}`

Delete car image.

**Authentication**: Required (User JWT, must be owner)

**Response**: `200 OK`

#### `PUT /api/cars/{id}/status`

Update car status.

**Authentication**: Required (User JWT, must be owner)

**Request Body**:
```json
{
  "status": "active"
}
```

**Response**: `200 OK`

#### `POST /api/cars/{id}/book`

Upload registration book to existing car.

**Authentication**: Required (User JWT, must be owner)

**Request Body**: (Multipart form data)
- `book_file` - Registration book image file

**Response**: `200 OK`

#### `POST /api/cars/{id}/inspection`

Upload inspection results via URL.

**Authentication**: Required (User JWT, must be owner)

**Request Body**:
```json
{
  "url": "https://example.com/inspection"
}
```

**Response**: `200 OK`

#### `PATCH /api/cars/{id}/draft`

Auto-save car draft.

**Authentication**: Required (User JWT, must be owner)

**Request Body**: (JSON)
- Car information fields

**Response**: `200 OK`

#### `GET /api/cars/{id}/review`

Review car publish readiness.

**Authentication**: Required (User JWT, must be owner)

**Response**: `200 OK`
```json
{
  "ready": false,
  "issues": [
    "At least 5 images are required",
    "Valid price is required"
  ]
}
```

#### `POST /api/cars/{id}/discard`

Discard car draft.

**Authentication**: Required (User JWT, must be owner)

**Response**: `200 OK`

#### `GET /api/cars/{id}/restore-progress`

Get car data for restoring progress (owner only).

**Authentication**: Required (User JWT, must be owner)

**Query Parameters**:
- `lang` - Language preference (en, th, default: en)

**Response**: `200 OK`

#### `GET /api/cars/{id}/estimate`

Get estimated market price for a car.

**Authentication**: Required (User JWT)

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "estimatedPrice": 450000
  }
}
```

---

### Favourites

#### `GET /api/favorites/my`

Get current user's favourite listings (buyer-only).

**Authentication**: Required (User JWT, buyer role)

**Response**: `200 OK`
```json
{
  "success": true,
  "code": 200,
  "data": [ ... ]
}
```

#### `POST /api/favorites/{carId}`

Add car to favourites (buyer-only).

**Authentication**: Required (User JWT, buyer role)

**Response**: `200 OK`

#### `DELETE /api/favorites/{carId}`

Remove car from favourites (buyer-only).

**Authentication**: Required (User JWT, buyer role)

**Response**: `200 OK`

---

### Recent Views

#### `GET /api/recent-views`

Get current user's recent views (buyer-only).

**Authentication**: Required (User JWT, buyer role)

**Query Parameters**:
- `limit` - Maximum number of views to return (default: 20, max: 100)
- `lang` - Language preference (en, th, default: en)

**Response**: `200 OK`
```json
{
  "success": true,
  "code": 200,
  "data": [ ... ]
}
```

#### `POST /api/recent-views`

Record a car view (buyer-only).

**Authentication**: Required (User JWT, buyer role)

**Request Body**:
```json
{
  "car_id": 123
}
```

**Response**: `200 OK`

---

### Reports

#### `POST /api/reports/cars/{id}`

Submit car report.

**Authentication**: Required (User JWT)

**Request Body**:
```json
{
  "topic": "false_information",
  "subTopics": ["Wrong mileage", "Fake photos"],
  "description": "Detailed description of the issue"
}
```

**Response**: `201 Created`

#### `POST /api/reports/sellers/{id}`

Submit seller report.

**Authentication**: Required (User JWT)

**Request Body**:
```json
{
  "topic": "fraud",
  "subTopics": ["Fake car", "No response"],
  "description": "Detailed description of the issue"
}
```

**Response**: `201 Created`

---

### Reference Data

#### `GET /api/reference-data/all`

Get all reference data for dropdowns and filters.

**Authentication**: Not required

**Query Parameters**:
- `lang` - Language preference (en, th, default: en)

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "bodyTypes": [ ... ],
    "transmissions": [ ... ],
    "fuelTypes": [ ... ],
    "drivetrains": [ ... ],
    "colors": [ ... ],
    "provinces": [ ... ]
  }
}
```

#### `GET /api/reference-data/brands`

Get all car brands.

**Authentication**: Not required

**Query Parameters**:
- `lang` - Language preference (en, th, default: en)

**Response**: `200 OK`

#### `GET /api/reference-data/models`

Get all car models.

**Authentication**: Not required

**Query Parameters**:
- `lang` - Language preference (en, th, default: en)

**Response**: `200 OK`

#### `GET /api/reference-data/submodels`

Get all car submodels.

**Authentication**: Not required

**Query Parameters**:
- `lang` - Language preference (en, th, default: en)

**Response**: `200 OK`

---

### Admin Endpoints

All admin endpoints are prefixed with `/api/admin/` and require:
1. Admin JWT authentication
2. IP whitelist validation

#### Admin Authentication

- `POST /api/admin/auth/signin` - Admin sign in
- `GET /api/admin/auth/me` - Get current admin information
- `POST /api/admin/auth/signout` - Admin sign out
- `POST /api/admin/auth/refresh` - Refresh admin authentication token

#### Admin Dashboard

- `GET /api/admin/dashboard/stats` - Get dashboard statistics
- `GET /api/admin/dashboard/chart` - Get user activity chart data
- `GET /api/admin/dashboard/top-brands` - Get top 10 active brands
- `GET /api/admin/dashboard/recent-reports` - Get recent pending reports

#### Admin Account Management

- `GET /api/admin/admins` - List all admins
- `POST /api/admin/admins` - Create a new admin
- `PATCH /api/admin/admins/{id}` - Update an admin
- `DELETE /api/admin/admins/{id}` - Delete an admin

#### Admin User Management

- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create a new user
- `GET /api/admin/users/{id}` - Get user details
- `PATCH /api/admin/users/{id}` - Update a user
- `DELETE /api/admin/users/{id}` - Delete a user
- `POST /api/admin/users/{id}/ban` - Ban a user

#### Admin Car Management

- `GET /api/admin/cars` - List all cars
- `POST /api/admin/cars` - Create a new car
- `PATCH /api/admin/cars/{id}` - Update a car
- `DELETE /api/admin/cars/{id}` - Delete a car
- `POST /api/admin/cars/{id}/remove` - Remove a car listing

#### Admin Reports Management

- `GET /api/admin/reports` - List all reports
- `POST /api/admin/reports/{id}/resolve` - Resolve a report
- `POST /api/admin/reports/{id}/dismiss` - Dismiss a report

#### Admin IP Whitelist

- `GET /api/admin/ip-whitelist` - View whitelisted IP addresses
- `POST /api/admin/ip-whitelist/add` - Add IP address to whitelist
- `DELETE /api/admin/ip-whitelist/remove` - Remove IP address from whitelist
- `POST /api/admin/ip-whitelist/check` - Check IP deletion impact

#### Admin Market Price

- `GET /api/admin/market-price/data` - Get all market prices
- `POST /api/admin/market-price/upload` - Upload DLT PDF

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
