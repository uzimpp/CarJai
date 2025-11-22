# Test Documentation

Comprehensive guide to testing strategies, test structure, running tests, and test coverage for the CarJai platform.

---

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Test Data](#test-data)
5. [Test Coverage](#test-coverage)
6. [CI/CD Testing](#cicd-testing)
7. [Writing Tests](#writing-tests)
8. [Best Practices](#best-practices)

---

## Testing Strategy

### Testing Levels

**Unit Tests**:
- Test individual functions and methods
- Mock external dependencies
- Fast execution
- High coverage target

**Integration Tests** :
- `extraction_service_test.go` - Tests PDF extraction with real database connection

### Testing Approach

**Backend (Go)**:
- Use Go's built-in `testing` package
- Table-driven tests for multiple scenarios
- Test fixtures for consistent data
- Mock external services (OCR, OAuth)



---

## Test Structure

### Backend Test Organization

```
backend/tests/
├── handlers/              # Handler unit tests 
│   ├── admin_auth_handler_test.go
│   ├── car_handler_test.go
│   ├── user_auth_handler_test.go
│   ├── mocks.go           # Mock services for testing
│   └── ...
├── extraction_service_test.go  # Integration test (uses real database)
├── http_test.go                # HTTP utility tests
├── ip_test.go                  # IP whitelist tests
├── jwt_test.go                 # JWT authentication tests
├── password_test.go            # Password hashing tests
├── security_test.go            # Security tests
├── run_tests.sh                # Test runner script
├── price2568.pdf               # Test PDF for extraction
└── registration_book.png       # Test image for OCR
```

### Test Categories

**Authentication Tests** (`jwt_test.go`):
- JWT token generation
- Token validation
- Token expiration
- User and admin token separation

**Password Tests** (`password_test.go`):
- Password hashing (bcrypt)
- Password validation
- Password strength requirements

**Security Tests** (`security_test.go`):
- Authentication middleware
- Authorization checks
- IP whitelist validation
- Rate limiting

**Handler Tests** (`handlers/*_test.go`):
- HTTP request/response handling
- Error handling
- Status codes
- Response format


**Service Tests**:
- Business logic validation
- Data processing
- External service integration (mocked)

**Integration Tests**:
- `extraction_service_test.go` - Tests PDF extraction with real database connection

---

## Running Tests

### Backend Tests

**Run all tests**:
```bash
docker exec -it carjai-backend go test ./...
```

**Run specific test file**:
```bash
docker exec -it carjai-backend go test ./tests/jwt_test.go
```

**Run tests in specific package**:
```bash
docker exec -it carjai-backend go test ./tests/handlers/...
```

**Run with verbose output**:
```bash
docker exec -it carjai-backend go test -v ./...
```

**Run specific test function**:
```bash
docker exec -it carjai-backend go test -v -run TestFunctionName ./...
```

### Test with Coverage

**Generate coverage report**:
```bash
docker exec -it carjai-backend go test -cover ./...
```

**Detailed coverage report**:
```bash
docker exec -it carjai-backend sh -c "cd /app && go test -coverprofile=coverage.out ./... && go tool cover -html=coverage.out -o coverage.html"
```

**View coverage report** (copy from container):
```bash
docker exec -it carjai-backend sh -c "cd /app && go test -coverprofile=coverage.out ./..."
docker cp carjai-backend:/app/coverage.out ./coverage.out
docker exec -it carjai-backend sh -c "cd /app && go tool cover -html=coverage.out -o coverage.html"
docker cp carjai-backend:/app/coverage.html ./coverage.html
```

**Coverage by package**:
```bash
docker exec -it carjai-backend go test -cover ./tests/...
```

### Test Script

Use the provided test runner script in Docker:

```bash
docker exec -it carjai-backend sh /app/tests/run_tests.sh
```

### Docker Testing

**Run tests in Docker container** (recommended):
```bash
# Ensure all services are running
docker compose up -d

# Run all tests
docker exec -it carjai-backend go test ./...

# Run specific test package
docker exec -it carjai-backend go test ./tests/handlers/...
```

**Run tests with database**:
```bash
# Ensure database container is running
docker compose up -d database backend

# Run tests
docker exec -it carjai-backend go test ./tests/...
```

---

## Test Data

### Database Seeding

Use the unified seeding system for test data:

**Seed all test data**:
```bash
docker exec -it carjai-backend /app/scripts/seed --all
```

**Seed specific data types**:
```bash
# Users only
docker exec -it carjai-backend /app/scripts/seed --users

# Users and cars
docker exec -it carjai-backend /app/scripts/seed --users --cars

# Reports
docker exec -it carjai-backend /app/scripts/seed --reports
```

**Available seed options**:
- `--all` - Seed everything
- `--users` - Users, sellers, buyers
- `--cars` - Cars with images and inspections
- `--reports` - Car and seller reports
- `--favorites` - User favourites
- `--recent-views` - Recent viewing history
- `--market-price` - Market prices from PDF

### Test Data Characteristics

**Users**:
- 60 demo users (45 buyers, 15 sellers)
- Password: `Demo1234` (properly hashed)
- Realistic profiles and contact information

**Cars**:
- 30 demo cars
- Random brands, models, years
- Images, fuel types, colors, inspections
- All cars have status `active`
- Chassis numbers start with `DEMO`

**Reports**:
- 50 reports (70% car, 30% seller)
- Mix of statuses (pending, reviewed, resolved, dismissed)
- Realistic topics and descriptions

**Favourites**:
- Buyers favourite 10-30 random cars each
- Spread over last 30 days

**Recent Views**:
- Buyers view 5-20 random cars each
- Multiple views per car
- Spread over last 30 days

### Test Fixtures

**Test Files**:
- `price2568.pdf` - DLT price PDF for extraction testing
- `registration_book.png` - Registration book image for OCR testing

**Test Database**:
- Separate test database (configured in test environment)
- Migrations run before tests
- Data cleaned/reset between test runs (if configured)

---

## Test Coverage

### Current Coverage

**Backend Coverage**:
- Authentication (JWT, Google OAuth)
- Password hashing and validation
- IP whitelist functionality
- Security middleware
- HTTP request/response handling
- OCR extraction service
- Database operations

**Coverage Goals**:
- Unit tests: 80%+ coverage
- Integration tests: Critical paths covered
- Handler tests: All endpoints tested

### Coverage Reports

**Generate HTML coverage report**:
```bash
docker exec -it carjai-backend sh -c "cd /app && go test -coverprofile=coverage.out ./... && go tool cover -html=coverage.out -o coverage.html"
```

**Copy coverage report from container**:
```bash
docker cp carjai-backend:/app/coverage.html ./coverage.html
docker cp carjai-backend:/app/coverage.out ./coverage.out
```

**View coverage by function**:
```bash
docker exec -it carjai-backend sh -c "cd /app && go test -coverprofile=coverage.out ./... && go tool cover -func=coverage.out"
```

---

## CI/CD Testing

### GitHub Actions Test Pipeline

**Automated Testing**:
- Tests run on every push and pull request
- Tests run on multiple Node.js versions (frontend)
- Tests run with PostgreSQL service container (backend)
- Maintainability index calculated using Lizard
- Artifacts uploaded: test coverage reports and maintainability reports

**Test Workflow**:
1. Checkout code
2. Set up Go/Node.js environment
3. Install dependencies
4. Set up PostgreSQL service
5. Run migrations
6. Run tests
7. Generate coverage reports
8. Calculate maintainability index (using Lizard)
9. Upload artifacts (test coverage, maintainability report)

### Docker Health Checks

**Health Check Tests**:
- Docker containers health verification
- Service connectivity tests
- Database connection tests
- API endpoint availability

**Health Check Script**:
```bash
# Check all services
docker compose ps

# Check specific service
docker exec carjai-backend curl http://localhost:8080/health
```

### Test Environment

**CI Test Configuration**:
- Separate test database
- Test environment variables
- Mock external services
- Isolated test execution

---

## Writing Tests

### Go Test Structure

**Basic Test Function**:
```go
func TestFunctionName(t *testing.T) {
    // Arrange
    input := "test input"
    expected := "expected output"
    
    // Act
    result := FunctionToTest(input)
    
    // Assert
    if result != expected {
        t.Errorf("Expected %s, got %s", expected, result)
    }
}
```

**Table-Driven Tests**:
```go
func TestMultipleScenarios(t *testing.T) {
    tests := []struct {
        name     string
        input    string
        expected string
    }{
        {
            name:     "scenario 1",
            input:    "input1",
            expected: "output1",
        },
        {
            name:     "scenario 2",
            input:    "input2",
            expected: "output2",
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := FunctionToTest(tt.input)
            if result != tt.expected {
                t.Errorf("Expected %s, got %s", tt.expected, result)
            }
        })
    }
}
```

### Handler Tests

**HTTP Handler Test**:
```go
func TestHandler(t *testing.T) {
    // Setup
    req := httptest.NewRequest("GET", "/api/endpoint", nil)
    w := httptest.NewRecorder()
    
    // Execute
    handler(w, req)
    
    // Assert
    if w.Code != http.StatusOK {
        t.Errorf("Expected status 200, got %d", w.Code)
    }
}
```

### Database Tests

**Database Test Setup**:
```go
func TestDatabaseOperation(t *testing.T) {
    // Setup test database
    db := setupTestDB(t)
    defer db.Close()
    
    // Run test
    // ...
}
```

### Mocking External Services

**Mock OCR Service**:
```go
type MockOCRService struct {
    ExtractFunc func(image []byte) (string, error)
}

func (m *MockOCRService) Extract(image []byte) (string, error) {
    if m.ExtractFunc != nil {
        return m.ExtractFunc(image)
    }
    return "", nil
}
```

---

## Best Practices

### Test Organization

1. **One test file per source file**
   - `user_service.go` → `user_service_test.go`

2. **Group related tests**
   - Use subtests for related scenarios
   - Use table-driven tests for multiple inputs

3. **Clear test names**
   - Descriptive function names
   - Use `TestFunctionName_Scenario_ExpectedResult` pattern

### Test Data

1. **Use fixtures**
   - Consistent test data
   - Reusable test helpers

2. **Isolate tests**
   - Each test should be independent
   - Clean up after tests

3. **Use realistic data**
   - Test with real-world scenarios
   - Edge cases and error conditions

### Assertions

1. **Clear error messages**
   - Include expected and actual values
   - Describe what went wrong

2. **Test both success and failure**
   - Happy path
   - Error conditions
   - Edge cases

3. **Verify side effects**
   - Check database changes
   - Verify external service calls

### Performance

1. **Fast tests**
   - Avoid slow operations
   - Use mocks for external services

2. **Parallel execution**
   - Use `t.Parallel()` when safe
   - Avoid shared state

3. **Test isolation**
   - Each test should be independent
   - No test dependencies

---

## Additional Resources

- **Developer Documentation**: `docs/Developer-Documentation.md`
- **API Documentation**: `docs/API-Documentation.md`
- **Backend README**: `backend/README.md`
- **Go Testing Package**: https://pkg.go.dev/testing

---

