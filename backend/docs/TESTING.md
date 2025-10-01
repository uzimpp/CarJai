# CarJai Testing Guide

Comprehensive testing guide for the CarJai platform.

## 🚀 Quick Start

### Run All Tests
```bash
# Backend tests
cd backend
go test ./...

# Frontend tests
cd frontend
npm test

# With coverage
go test -cover ./...
```

## 🧪 Test Types

### Unit Tests
Tests individual functions and components in isolation.

### Integration Tests
Tests how different components work together across the system.

### API Tests
Tests all API endpoints including admin, user, and OCR endpoints.

### Security Tests
Tests authentication, authorization, and input validation.

## 📋 API Testing

### Admin Authentication

```bash
# Test admin sign in (saves cookie to file)
curl -X POST http://localhost:8080/admin/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"myadmin","password":"your_password"}' \
  -c admin_cookies.txt

# Test protected admin endpoint using saved cookie
curl -X GET http://localhost:8080/admin/auth/me \
  -b admin_cookies.txt
```

### User Authentication

```bash
# Test user registration (saves cookie to file)
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"user123","email":"user@example.com","password":"password123","name":"John Doe"}' \
  -c user_cookies.txt

# Test user sign in (saves cookie to file)
curl -X POST http://localhost:8080/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"user123","password":"password123"}' \
  -c user_cookies.txt

# Test protected user endpoint using saved cookie
curl -X GET http://localhost:8080/api/auth/me \
  -b user_cookies.txt
```

### Document Verification

```bash
# Test document verification using saved user cookie
curl -X POST http://localhost:8080/api/ocr/verify-document \
  -b user_cookies.txt \
  -F "file=@document.jpg" \
  -F "document_type=id_card"
```

### Health & Monitoring

```bash
# Test health endpoints
curl http://localhost:8080/health
curl http://localhost:8080/admin/health
curl http://localhost:8080/metrics
```

## 🛡️ Security Testing

### SQL Injection Testing

```bash
# Test SQL injection in sign in
curl -X POST http://localhost:8080/admin/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin'\'' OR 1=1--","password":"anything"}'

# Expected: Should return 401 (Invalid credentials)
```

### XSS Testing

```bash
# Test XSS in user registration
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"user123","email":"user@example.com","password":"password123","name":"<script>alert('"'"'XSS'"'"')</script>"}'

# Expected: Should be sanitized or rejected
```

### Authentication Bypass

```bash
# Test accessing protected endpoints without cookies
curl -X GET http://localhost:8080/admin/auth/me
curl -X GET http://localhost:8080/api/auth/me

# Expected: Should return 401 (Unauthorized)
```

## 📊 Performance Testing

### Load Testing

```bash
# Install Apache Bench
# Ubuntu/Debian: sudo apt-get install apache2-utils
# macOS: brew install httpd

# Test sign in endpoint
ab -n 100 -c 10 -H "Content-Type: application/json" \
  -p signin_data.json http://localhost:8080/admin/auth/signin

# Create test data
echo '{"username":"myadmin","password":"your_password"}' > signin_data.json
```

### Concurrent Testing

```bash
# Test concurrent user registrations
for i in {1..10}; do
  curl -X POST http://localhost:8080/api/auth/signup \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"user$i\",\"email\":\"user$i@example.com\",\"password\":\"password123\",\"name\":\"User $i\"}" &
done
wait
```

## 🔍 Debugging Tests

### Verbose Output

```bash
# Run tests with detailed output
go test -v ./...

# Run specific test
go test -v -run TestSpecificFunction ./package/
```

### Coverage Analysis

```bash
# Generate coverage report
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out

# View coverage in terminal
go tool cover -func=coverage.out
```

## 📈 Test Metrics

### Coverage Goals
- **Unit Tests**: > 80% coverage
- **Integration Tests**: > 70% coverage
- **API Tests**: > 90% endpoint coverage

### Performance Goals
- **Sign in Response**: < 200ms
- **Token Validation**: < 50ms
- **Health Check**: < 50ms
- **OCR Processing**: < 5 seconds

### Security Goals
- **Password Hashing**: bcrypt with cost 12+
- **Rate Limiting**: 5 sign in attempts per 15 minutes
- **Input Validation**: 100% of user inputs sanitized

## 🚨 Common Issues

### Database Connection
```bash
# Check if database is running
docker ps | grep postgres

# Check database logs
docker logs carjai-database
```

### Port Conflicts
```bash
# Check if port is in use
lsof -i :8080
lsof -i :3000

# Kill process using port
sudo kill -9 $(lsof -t -i:8080)
```

### Environment Variables
```bash
# Check environment variables
env | grep DB_
env | grep JWT_

# Set for testing
export DB_HOST=localhost
export DB_PASSWORD=password
export JWT_SECRET=test-secret-key
```

## 🔄 Continuous Integration

### GitHub Actions Example

```yaml
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
        go-version: 1.22
    
    - name: Run tests
      run: go test -v -cover ./...
      env:
        DB_HOST: localhost
        DB_PASSWORD: password
        DB_NAME: carjai_test
        JWT_SECRET: test-secret-key
```

## 📚 Additional Resources

- [API Documentation](./API.md) - Complete API reference
