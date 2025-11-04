# Maintainability Index Guide for CarJai

This document explains how to measure and improve the maintainability index for the CarJai project.

## What is Maintainability Index?

The Maintainability Index is a software metric that indicates how easy a codebase is to maintain. It ranges from 0 to 100 (higher is better) and considers:
- **Cyclomatic Complexity** - Measures the number of independent paths through code
- **Lines of Code (LOC)** - Code volume
- **Halstead Volume** - Complexity based on operators and operands

## Maintainability Index Scale

- **20-100**: Good maintainability (desirable)
- **10-19**: Moderate maintainability (acceptable but review recommended)
- **0-9**: Poor maintainability (refactoring strongly recommended)

## Tools for Measuring Maintainability

### For Go Backend

#### 1. gocyclo
Cyclomatic complexity checker for Go code.

**Installation:**
```bash
go install github.com/fzipp/gocyclo/cmd/gocyclo@latest
```

**Usage:**
```bash
# From backend directory
gocyclo -avg -over 15 .
```
- `-avg`: Show average complexity per function
- `-over 15`: Only show functions with complexity > 15

**Example output:**
```
15 main main main.go:22:1
```

#### 2. Go Report Card
Online tool for Go code quality analysis.

**Usage:**
1. Push code to GitHub
2. Visit: https://goreportcard.com/
3. Enter your repository URL
4. Get comprehensive report including maintainability metrics

#### 3. GoMetaLinter / golangci-lint
Multi-tool linter with maintainability checks.

**Installation:**
```bash
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
```

**Usage:**
```bash
cd backend
golangci-lint run --enable-all --disable-all -E gocyclo,gocritic,maligned,unused
```

#### 4. Code Climate (Commercial)
Provides maintainability index scores.

**Usage:**
1. Sign up at https://codeclimate.com/
2. Add GitHub repository
3. Get automated maintainability reports

### For TypeScript/Next.js Frontend

#### 1. ESLint Complexity Rules
Built-in maintainability checking.

**Usage:**
```bash
cd frontend
npm run lint
```

Configure in `.eslintrc`:
```json
{
  "rules": {
    "complexity": ["error", 10],
    "max-lines": ["error", 500],
    "max-lines-per-function": ["error", 50]
  }
}
```

#### 2. SonarQube
Enterprise-grade code quality platform.

**Installation:**
```bash
# Using Docker
docker run -d --name sonarqube -p 9000:9000 sonarqube:latest
```

**Usage:**
1. Visit http://localhost:9000
2. Create project
3. Run scanner:
```bash
npx sonar-scanner
```

#### 3. Code Climate
Also supports JavaScript/TypeScript.

#### 4. Plato
Visual complexity analysis.

**Installation:**
```bash
npm install -g plato
```

**Usage:**
```bash
cd frontend
plato -r -d report -t "CarJai Frontend" src/
```

## Recommended Setup for CarJai

### Quick Check Script

Create `scripts/check-maintainability.sh`:

```bash
#!/bin/bash

echo "=== CarJai Maintainability Check ==="
echo ""

# Check backend
echo "--- Go Backend ---"
if command -v gocyclo &> /dev/null; then
    cd backend
    echo "Cyclomatic Complexity:"
    gocyclo -avg -over 10 .
    cd ..
else
    echo "gocyclo not installed. Install with: go install github.com/fzipp/gocyclo/cmd/gocyclo@latest"
fi

# Check frontend
echo ""
echo "--- TypeScript Frontend ---"
if command -v npm &> /dev/null; then
    cd frontend
    npm run lint
    cd ..
else
    echo "npm not available"
fi

echo ""
echo "=== Check Complete ==="
```

### CI/CD Integration

Add to `.github/workflows/maintainability.yml`:

```yaml
name: Maintainability Check

on:
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  backend-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.24'
      
      - name: Install gocyclo
        run: go install github.com/fzipp/gocyclo/cmd/gocyclo@latest
      
      - name: Check complexity
        run: |
          cd backend
          gocyclo -avg -over 15 .
      
      - name: Run linter
        run: |
          cd backend
          go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
          golangci-lint run

  frontend-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Run linter
        run: |
          cd frontend
          npm run lint
```

## Interpretation Guidelines

### Cyclomatic Complexity Thresholds

| Complexity | Rating | Action |
|------------|--------|--------|
| 1-10 | ✅ Simple | No action needed |
| 11-20 | ⚠️ Moderate | Review, consider refactoring |
| 21-50 | ❌ Complex | Refactor strongly recommended |
| 50+ | 🚫 Very Complex | Must refactor |

### Common Issues and Fixes

#### High Complexity Functions

**Problem:** Large functions with many branches

**Solution:** Extract smaller functions

**Example (Go):**
```go
// Before (complexity: 15)
func (s *CarService) ProcessCarSubmission(car *models.Car, images []*multipart.FileHeader, userID int) error {
    if err := validateCarData(car); err != nil {
        return err
    }
    if err := checkDuplicate(car); err != nil {
        return err
    }
    if err := validateImages(images); err != nil {
        return err
    }
    if err := uploadImages(images); err != nil {
        return err
    }
    // ... many more conditions
}

// After (complexity: 3, 5, 4)
func (s *CarService) ProcessCarSubmission(car *models.Car, images []*multipart.FileHeader, userID int) error {
    if err := s.validateSubmission(car, images); err != nil {
        return err
    }
    if err := s.storeCar(car, userID); err != nil {
        return err
    }
    return s.uploadImages(images, car.ID)
}
```

#### Large Files

**Problem:** Files with 500+ lines

**Solution:** Split into smaller, focused modules

#### Deep Nesting

**Problem:** Too many if/else levels

**Solution:** Early returns, guard clauses, extract functions

**Example (TypeScript):**
```typescript
// Before (complexity: 12)
function processCar(data: CarData) {
    if (data) {
        if (data.price) {
            if (data.price > 0) {
                if (data.images) {
                    if (data.images.length > 0) {
                        // process
                    }
                }
            }
        }
    }
}

// After (complexity: 3)
function processCar(data: CarData) {
    if (!data || !data.price || data.price <= 0) {
        throw new Error('Invalid price');
    }
    if (!data.images || data.images.length === 0) {
        throw new Error('Images required');
    }
    // process
}
```

## Running Maintainability Checks

### One-time Check

```bash
# Backend
cd isp/CarJai/backend
gocyclo -avg -over 10 .

# Frontend
cd isp/CarJai/frontend
npm run lint
```

### Automated Daily Check

Add to crontab:
```bash
0 9 * * * /path/to/scripts/check-maintainability.sh > /tmp/maintainability-report.txt
```

### IDE Integration

#### VS Code
- Install "Code Metrics" extension
- Install "Complexity" extension
- Install "SonarLint" extension

#### GoLand
- Built-in complexity analysis
- View: Code → Code Analysis → Analyze Code

## Best Practices for Maintaining Good Score

1. **Keep functions small** (10-50 lines)
2. **Limit cyclomatic complexity** (< 10 per function)
3. **Extract reusable code** into functions
4. **Use early returns** to reduce nesting
5. **Follow DRY principle** (Don't Repeat Yourself)
6. **Add comments** for complex business logic
7. **Write unit tests** for complex functions
8. **Regular refactoring** of high-complexity code

## Resources

- [Cyclomatic Complexity Explained](https://en.wikipedia.org/wiki/Cyclomatic_complexity)
- [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments)
- [TypeScript Complexity Rules](https://eslint.org/docs/latest/rules/complexity)
- [gocyclo Documentation](https://github.com/fzipp/gocyclo)
- [golangci-lint Documentation](https://golangci-lint.run/)

## Current Status

Run the check script regularly to track maintainability over time:

```bash
bash isp/CarJai/scripts/check-maintainability.sh
```

Target metrics:
- Average cyclomatic complexity: < 10
- No functions with complexity > 20
- All linter checks passing
- Maintainability index: > 70

