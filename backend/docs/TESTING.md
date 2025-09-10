# CarJai Backend Testing Guide

A comprehensive testing guide for the CarJai Admin Authentication system.

## 🧪 Test Types

### 1. Unit Tests
Tests individual functions in isolation.

### 2. Integration Tests
Tests how different components work together.

### 3. Security Tests
Tests the security of the system.

### 4. API Tests
Tests the API endpoints.

## 🚀 Running Tests

### Prerequisites

```bash
# Install Go testing tools
go install github.com/stretchr/testify/assert@latest
go install github.com/stretchr/testify/require@latest
```

### Run All Tests

```bash
# Run all tests
go test ./...

# Run with verbose output
go test -v ./...

# Run with coverage
go test -cover ./...

# Run specific package
go test ./utils/...

# Run specific test
go test -run TestHashPassword ./utils/
```

### Run Tests with Coverage

```bash
# Generate coverage report
go test -coverprofile=coverage.out ./...

# View coverage in browser
go tool cover -html=coverage.out

# View coverage in terminal
go tool cover -func=coverage.out
```

## 📋 Test Cases

### 1. Password Security Tests

```bash
# Run password tests
go test -v ./utils/ -run TestPassword

# Expected output:
# === RUN   TestHashPassword
# === RUN   TestHashPassword/valid_password
# === RUN   TestHashPassword/empty_password
# === RUN   TestHashPassword/long_password
# --- PASS: TestHashPassword (0.01s)
# === RUN   TestVerifyPassword
# === RUN   TestVerifyPassword/correct_password
# === RUN   TestVerifyPassword/wrong_password
# === RUN   TestVerifyPassword/empty_password
# === RUN   TestVerifyPassword/invalid_hash
# --- PASS: TestVerifyPassword (0.01s)
# PASS
```

### 2. IP Validation Tests

```bash
# Run IP tests
go test -v ./utils/ -run TestIP

# Expected output:
# === RUN   TestValidateIPAddress
# === RUN   TestValidateIPAddress/valid_IPv4
# === RUN   TestValidateIPAddress/valid_IPv6
# === RUN   TestValidateIPAddress/valid_CIDR_IPv4
# === RUN   TestValidateIPAddress/invalid_IP
# --- PASS: TestValidateIPAddress (0.01s)
```

### 3. JWT Token Tests

```bash
# Run JWT tests
go test -v ./utils/ -run TestJWT

# Expected output:
# === RUN   TestJWTManager_GenerateToken
# === RUN   TestJWTManager_ValidateToken
# === RUN   TestJWTManager_RefreshToken
# --- PASS: TestJWTManager_GenerateToken (0.01s)
```

### 4. Security Tests

```bash
# Run security tests
go test -v ./tests/ -run TestSecurity

# Expected output:
# === RUN   TestPasswordSecurity
# === RUN   TestJWTSecurity
# === RUN   TestIPSecurity
# === RUN   TestRateLimitSecurity
# --- PASS: TestPasswordSecurity (0.01s)
```

## 🔧 Manual Testing

### 1. API Testing with curl

#### Login Test

```bash
# Test successful login
curl -X POST http://localhost:8080/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Expected response:
# {
#   "success": true,
#   "data": {
#     "admin": {
#       "id": 1,
#       "username": "admin",
#       "name": "System Administrator"
#     },
#     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#     "expires_at": "2024-01-01T18:00:00Z"
#   },
#   "message": "Login successful"
# }
```

#### Invalid Login Test

```bash
# Test invalid credentials
curl -X POST http://localhost:8080/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrongpassword"}'

# Expected response:
# {
#   "success": false,
#   "error": "Invalid credentials",
#   "code": 401
# }
```

#### Me Endpoint Test

```bash
# Test me endpoint with valid token
curl -X GET http://localhost:8080/admin/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected response:
# {
#   "success": true,
#   "data": {
#     "admin": {
#       "id": 1,
#       "username": "admin",
#       "name": "System Administrator"
#     },
#     "session": {
#       "ip_address": "127.0.0.1",
#       "created_at": "2024-01-01T10:00:00Z",
#       "expires_at": "2024-01-01T18:00:00Z"
#     }
#   }
# }
```

### 2. IP Whitelist Testing

#### Add IP to Whitelist

```bash
# Add IP to whitelist
curl -X POST http://localhost:8080/admin/ip-whitelist/add \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip_address":"192.168.1.100/32","description":"Test IP"}'

# Expected response:
# {
#   "success": true,
#   "message": "IP address added to whitelist successfully"
# }
```

#### Test IP Access

```bash
# Test from whitelisted IP
curl -X GET http://localhost:8080/admin/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Real-IP: 192.168.1.100"

# Test from non-whitelisted IP
curl -X GET http://localhost:8080/admin/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Real-IP: 192.168.2.100"

# Expected response for non-whitelisted IP:
# {
#   "success": false,
#   "error": "IP address not authorized",
#   "code": 403
# }
```

### 3. Rate Limiting Testing

```bash
# Test rate limiting (5 requests per 15 minutes)
for i in {1..6}; do
  echo "Request $i:"
  curl -X POST http://localhost:8080/admin/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' \
    -w "Status: %{http_code}\n"
  echo "---"
done

# Expected: First 5 requests return 200, 6th returns 429
```

## 🛡️ Security Testing

### 1. SQL Injection Testing

```bash
# Test SQL injection in login
curl -X POST http://localhost:8080/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin'\'' OR 1=1--","password":"anything"}'

# Expected: Should return 401 (Invalid credentials)
```

### 2. XSS Testing

```bash
# Test XSS in IP description
curl -X POST http://localhost:8080/admin/ip-whitelist/add \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip_address":"192.168.1.100/32","description":"<script>alert('"'"'XSS'"'"')</script>"}'

# Expected: Should be sanitized or rejected
```

### 3. JWT Token Tampering

```bash
# Test tampered JWT token
curl -X GET http://localhost:8080/admin/auth/me \
  -H "Authorization: Bearer TAMPERED_TOKEN"

# Expected: Should return 401 (Invalid token)
```

## 📊 Performance Testing

### 1. Load Testing with Apache Bench

```bash
# Install Apache Bench
# Ubuntu/Debian: sudo apt-get install apache2-utils
# macOS: brew install httpd

# Test login endpoint
ab -n 100 -c 10 -H "Content-Type: application/json" \
  -p login_data.json http://localhost:8080/admin/auth/login

# Create login_data.json:
echo '{"username":"admin","password":"admin123"}' > login_data.json
```

### 2. Memory Usage Testing

```bash
# Monitor memory usage during load test
while true; do
  docker stats carjai-backend --no-stream
  sleep 5
done
```

## 🔍 Debugging Tests

### 1. Verbose Test Output

```bash
# Run tests with detailed output
go test -v -race ./...

# Run specific test with debug info
go test -v -run TestSpecificFunction ./package/
```

### 2. Test Coverage Analysis

```bash
# Generate detailed coverage report
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html

# Open coverage report
open coverage.html  # macOS
xdg-open coverage.html  # Linux
```

### 3. Benchmark Tests

```bash
# Run benchmark tests
go test -bench=. ./utils/

# Run benchmark with memory profiling
go test -bench=. -benchmem ./utils/
```

## 🚨 Common Test Issues

### 1. Database Connection Issues

```bash
# Check if database is running
docker ps | grep postgres

# Check database logs
docker logs carjai-db

# Test database connection
psql -h localhost -U postgres -d carjai -c "SELECT 1;"
```

### 2. Port Conflicts

```bash
# Check if port is in use
lsof -i :8080

# Kill process using port
sudo kill -9 $(lsof -t -i:8080)
```

### 3. Environment Variables

```bash
# Check environment variables
env | grep DB_
env | grep JWT_

# Set environment variables for testing
export DB_HOST=localhost
export DB_PASSWORD=password
export JWT_SECRET=test-secret-key
```

## 📈 Test Metrics

### Coverage Goals

- **Unit Tests**: > 80% coverage
- **Integration Tests**: > 70% coverage
- **Security Tests**: 100% of critical paths

### Performance Goals

- **Login Response**: < 200ms
- **Token Validation**: < 50ms
- **IP Whitelist Check**: < 10ms
- **Database Queries**: < 100ms

### Security Goals

- **Password Hashing**: bcrypt with cost 12+
- **JWT Expiration**: 8 hours maximum
- **Rate Limiting**: 5 login attempts per 15 minutes
- **IP Validation**: 100% accuracy

## 🔄 Continuous Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: password
          POSTGRES_DB: carjai_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Go
      uses: actions/setup-go@v3
      with:
        go-version: 1.24.3
    
    - name: Run tests
      run: go test -v -cover ./...
      env:
        DB_HOST: localhost
        DB_PASSWORD: password
        DB_NAME: carjai_test
        JWT_SECRET: test-secret-key
```

## 🎯 Test Automation

### Pre-commit Hooks

```bash
# Install pre-commit
pip install pre-commit

# Create .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: go-test
        name: Go Tests
        entry: go test ./...
        language: system
        pass_filenames: false
        always_run: true

# Install hooks
pre-commit install
```

### Test Scripts

```bash
#!/bin/bash
# test.sh

echo "Running unit tests..."
go test -v ./utils/...

echo "Running integration tests..."
go test -v ./tests/...

echo "Running security tests..."
go test -v ./tests/ -run TestSecurity

echo "Generating coverage report..."
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html

echo "Tests completed!"
```

---

**Note:** Ensure all tests are run before deploying to production.