# System Documentation

Comprehensive documentation of the CarJai system architecture, infrastructure, deployment, security, and operations.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Infrastructure](#infrastructure)
3. [Deployment](#deployment)
4. [Security](#security)
5. [External Services](#external-services)
6. [Data Flow](#data-flow)
7. [Monitoring & Logging](#monitoring--logging)
8. [Performance](#performance)

---

## System Architecture

### High-Level Architecture

CarJai follows a three-tier architecture:

```
┌─────────────────┐
│   Frontend      │  Next.js 14 (App Router)
│   (Next.js)     │  TypeScript, TailwindCSS
└────────┬────────┘
         │ HTTP/REST API
         │
┌────────▼────────┐
│   Backend       │  Go HTTP Server
│   (GoLang)      │  JWT Authentication
└────────┬────────┘
         │ SQL
         │
┌────────▼────────┐
│   Database      │  PostgreSQL 15
│   (PostgreSQL)  │  Relational Database
└─────────────────┘
```

### Component Overview

**Frontend Layer**:
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: React Context API
- **Authentication**: Cookie-based JWT tokens

**Backend Layer**:
- **Language**: Go 1.24.3+
- **Framework**: Standard library HTTP server
- **Authentication**: Dual JWT systems (users and admins)
- **Middleware**: CORS, rate limiting, logging, authentication

**Database Layer**:
- **Database**: PostgreSQL 15
- **ORM**: Custom repository pattern
- **Migrations**: SQL migration files
- **Connection Pooling**: Built-in Go database/sql

### Technology Stack

**Frontend**:
- Next.js 14 (React framework)
- TypeScript (type safety)
- TailwindCSS (utility-first CSS)
- ESLint/Prettier (code quality)

**Backend**:
- Go 1.24.3+ (programming language)
- PostgreSQL driver (database)
- JWT-go (authentication)
- Standard library (HTTP, JSON, etc.)

**Infrastructure**:
- Docker & Docker Compose (containerization)
- GitHub Actions (CI/CD)
- PostgreSQL 15 (database)

---

## Infrastructure

### Local Development

**Docker Compose Setup**:

```yaml
services:
  frontend:    # Next.js development server
  backend:     # Go HTTP server
  database:    # PostgreSQL 15
```

**Ports**:
- Frontend: `3000`
- Backend: `8080`
- Database: `5432`

**Volumes**:
- Database data persistence
- Code hot-reload (development)

### CI/CD Pipeline

**GitHub Actions Workflows**:

1. **CI Pipeline** (`.github/workflows/Carjai-ci.yml`):
   - Frontend build and lint
   - Backend tests
   - Maintainability index calculation (Lizard)
   - Docker health checks
   - Automated testing on push/PR
   - Artifacts: test coverage and maintainability reports

2. **Auto Merge** (`.github/workflows/develop-to-main-auto-merge.yml`):
   - Docker health checks
   - Automated merge from `develop` to `main`
   - Release tag creation

**Pipeline Stages**:
1. Code checkout
2. Environment setup
3. Dependency installation
4. Build
5. Test execution
6. Maintainability analysis (Lizard)
7. Generate artifacts (coverage, maintainability reports)
8. Docker health checks
9. Merge (if on develop branch)

### Production Infrastructure

**Containerization**:
- Frontend: Docker image (Next.js production build)
- Backend: Docker image (Go binary)
- Database: PostgreSQL container or managed service

**Deployment Options**:
- Docker Compose (simple deployments)
- Kubernetes (scalable deployments)
- Cloud platforms (AWS, GCP, Azure)

---

## Deployment

### Deployment Process

1. **Build Docker Images**:
   ```bash
   docker build -t carjai-frontend ./frontend
   docker build -t carjai-backend ./backend
   ```

2. **Configure Environment**:
   - Set production environment variables
   - Configure database connection
   - Set up SSL certificates

3. **Run Migrations**:
   - Execute database migrations
   - Verify schema is up to date

4. **Start Services**:
   ```bash
   docker compose up -d
   ```

5. **Health Checks**:
   - Verify `/health` endpoint
   - Check database connectivity
   - Verify all services are running

### Environment Configuration

**Production Environment Variables**:
- `ENVIRONMENT=production`
- Production database credentials
- Secure JWT secrets
- CORS allowed origins (production domains)
- External API keys

**Security Considerations**:
- Use strong, unique JWT secrets
- Enable HTTPS/SSL
- Restrict database access
- Use environment-specific API keys

### Database Migrations

**Migration Strategy**:
- Migrations are versioned SQL files
- Run migrations before deploying new code
- Test migrations in staging first
- Keep migration history for rollback

**Migration Execution**:
- Migrations run automatically when the database container is first created
- SQL files in `backend/migrations/` are executed in numerical order by PostgreSQL's `docker-entrypoint-initdb.d` mechanism

For manual execution:
```bash
# Execute SQL files directly in the database container
docker exec -it carjai-database psql -U carjai_user -d carjai -f /docker-entrypoint-initdb.d/001_admin_auth.sql
```

---

## Security

### Authentication

**Dual JWT Systems**:
- **User JWT**: For regular users (buyers and sellers)
- **Admin JWT**: For administrators (separate secret)

**JWT Implementation**:
- Token stored in HTTP-only cookies
- Token expiration and refresh
- Secure token generation and validation

**Google OAuth**:
- Server-side token validation
- Account linking for existing users
- Secure OAuth callback handling

### Authorization

**Role-Based Access**:
- Users can have multiple roles (buyer, seller)
- Admin access requires separate authentication
- IP whitelist for admin portal

**Endpoint Protection**:
- Authentication middleware on protected routes
- Role-based access control
- Resource ownership validation

### IP Whitelisting

**Admin Portal Protection**:
- Database-stored IP whitelist
- IP validation middleware
- Admin management interface

**Implementation**:
- IP addresses stored in `admin_ip_whitelist` table
- Middleware checks IP before allowing admin access
- Admins can manage whitelist through UI

### Rate Limiting

**Protection Against Abuse**:
- Configurable rate limits per endpoint
- Different limits for different endpoint types
- 429 status code when limit exceeded

**Implementation**:
- Middleware-based rate limiting
- In-memory or Redis-based tracking
- Configurable per route

### CORS Protection

**Cross-Origin Resource Sharing**:
- Configurable allowed origins
- Secure CORS headers
- Preflight request handling

**Configuration**:
- Set via `CORS_ALLOWED_ORIGINS` environment variable
- Comma-separated list of origins
- Wildcard support for development

### Password Security

**Password Hashing**:
- Bcrypt with appropriate cost factor
- Secure password validation
- Password reset with JWT tokens

**Password Requirements**:
- Minimum length: 8 characters
- Complexity requirements (if configured)
- Secure reset token generation

### Data Protection

**Sensitive Data**:
- Passwords: Hashed with bcrypt
- JWT tokens: Stored in HTTP-only cookies
- API keys: Stored in environment variables

**Database Security**:
- Encrypted connections (SSL/TLS)
- Restricted database access
- Parameterized queries (SQL injection prevention)

---

## External Services

### OCR Service (Aigen API)

**Purpose**: Extract data from vehicle inspection certificates and registration books

**Integration**:
- API key stored in environment variable
- Document upload → OCR processing → Data extraction
- Error handling for failed extractions

**Usage**:
- Seller uploads document image
- Backend sends to Aigen API
- Extracted data returned and stored
- Seller reviews and verifies extracted data

### Google OAuth

**Purpose**: Alternative authentication method for users

**Integration**:
- Google Cloud Platform OAuth 2.0 credentials
- Client ID and secret in environment variables
- OAuth callback URL configuration

**Flow**:
1. User initiates Google sign-in
2. Redirect to Google authorization
3. User authorizes application
4. Google redirects with authorization code
5. Server exchanges code for ID token
6. Server validates ID token
7. Create/update user account
8. Return JWT token

### DLT Market Prices

**Purpose**: Price estimation data from Department of Land Transport

**Integration**:
- PDF extraction from DLT price documents
- Market price data stored in database
- Used for automatic price estimation

**Usage**:
- Admin uploads DLT PDF
- System extracts price data
- Prices stored by brand, model, submodel, year
- Used in car price estimation algorithm

---

## Data Flow

### User Request Flow

```
User Browser
    │
    ├─> Frontend (Next.js)
    │   │
    │   ├─> Authentication Check
    │   ├─> Route Protection
    │   └─> API Request
    │
    ├─> Backend API (Go)
    │   │
    │   ├─> CORS Middleware
    │   ├─> Rate Limiting
    │   ├─> Authentication Middleware
    │   ├─> Request Handler
    │   ├─> Service Layer
    │   └─> Database Query
    │
    └─> Database (PostgreSQL)
        │
        └─> Response
```

### Admin Request Flow

```
Admin Browser (Whitelisted IP)
    │
    ├─> Frontend Admin Portal
    │   │
    │   ├─> Admin Authentication
    │   └─> API Request
    │
    ├─> Backend Admin API
    │   │
    │   ├─> IP Whitelist Check
    │   ├─> Admin Authentication
    │   ├─> Admin Authorization
    │   └─> Admin Handler
    │
    └─> Database (PostgreSQL)
```

### Document Upload Flow

```
Seller Uploads Document
    │
    ├─> Frontend (Image Upload)
    │
    ├─> Backend (File Storage)
    │
    ├─> OCR Service (Aigen API)
    │   │
    │   └─> Extracted Data
    │
    ├─> Backend (Data Processing)
    │
    └─> Database (Store Data)
```

---

## Monitoring & Logging

### Request Logging

**Middleware-Based Logging**:
- All HTTP requests logged
- Request method, path, status code
- Response time
- IP address and user agent

**Log Format**:
- Structured logging (JSON or text)
- Timestamp, level, message
- Request context

### Error Logging

**Error Handling**:
- Errors logged with context
- Stack traces for debugging
- Error categorization
- Alerting for critical errors

### Database Logging

**Query Logging** (Development):
- SQL queries logged
- Query parameters
- Execution time
- Error tracking

### Health Monitoring

**Health Check Endpoint**:
- `GET /health`
- Database connectivity check
- Service status
- Uptime information

**Response**:
```json
{
  "status": "healthy",
  "services": {
    "database": {
      "status": "healthy",
      "response_time": "5ms"
    }
  },
  "uptime": "24h30m15s"
}
```

---

## Performance

### Frontend Optimization

**Next.js Optimizations**:
- Server-side rendering (SSR)
- Static site generation (SSG)
- Image optimization
- Code splitting
- Bundle optimization

### Backend Optimization

**Go Optimizations**:
- Efficient HTTP server
- Connection pooling
- Efficient database queries
- Minimal memory allocation
- Concurrent request handling

### Database Optimization

**PostgreSQL Optimizations**:
- Indexes on frequently queried columns
- Query optimization
- Connection pooling
- Efficient joins
- Proper data types

---

## Additional Resources

- **API Documentation**: `docs/API-Documentation.md`
- **Developer Documentation**: `docs/Developer-Documentation.md`
- **User Documentation**: `docs/User-Documentation.md`
- **Database Schema**: `backend/docs/schema.md`

---

