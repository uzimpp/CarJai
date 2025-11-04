# Quick Maintainability Check Guide

## How to Check Maintainability Index of CarJai

### 🚀 Quick Start (1 minute)

```bash
cd /Users/uzimp/Documents/KU/isp/CarJai
bash scripts/check-maintainability.sh
```

That's it! The script will check both backend (Go) and frontend (TypeScript) code.

---

## What Gets Checked

### ✅ Backend (Go)
- **Cyclomatic Complexity** - Measures code complexity
- **Code Formatting** - Ensures consistent style
- **Linting** - Catches common issues

### ✅ Frontend (TypeScript)
- **ESLint** - Type checking and code quality
- **Unused Variables** - Removes dead code
- **Type Safety** - Prevents runtime errors

---

## Installation (One-time Setup)

If `gocyclo` is not installed:

```bash
go install github.com/fzipp/gocyclo/cmd/gocyclo@latest
```

Add to your shell profile (~/.zshrc or ~/.bashrc):
```bash
export PATH="$HOME/go/bin:$PATH"
```

---

## Understanding Results

### Backend Complexity Scores

| Score | Meaning | Action |
|-------|---------|--------|
| 1-10 | ✅ Good | Keep it up! |
| 11-20 | ⚠️ Moderate | Consider refactoring |
| 20+ | 🔴 High | Must refactor |

### Current Top Issues

1. **`TranslateCarForDisplay`** - Complexity: 51 🔴
2. **`ValidatePublish`** - Complexity: 34 🔴
3. **`ExtractMarketPricesFromPDF`** - Complexity: 29 🔴

See `MAINTAINABILITY_REPORT.md` for full details.

---

## Quick Fixes

### Fix Go Formatting Issues
```bash
cd backend
gofmt -w .
```

### Fix Frontend Linting
```bash
cd frontend
npm run lint -- --fix
```

### Run Specific Checks

**Backend only:**
```bash
cd backend
gocyclo -avg -over 10 .
```

**Frontend only:**
```bash
cd frontend
npm run lint
```

---

## Automated Checks

### Weekly Check
Add to crontab:
```bash
0 9 * * 1 cd /path/to/CarJai && bash scripts/check-maintainability.sh > ~/reports/maintainability-$(date +\%Y\%m\%d).txt
```

### Pre-Commit Hook
Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash
cd "$(git rev-parse --show-toplevel)"
bash scripts/check-maintainability.sh || exit 1
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

---

## Files Created

- ✅ `scripts/check-maintainability.sh` - Main check script
- ✅ `MAINTAINABILITY.md` - Detailed guide with all tools
- ✅ `MAINTAINABILITY_REPORT.md` - Current status report
- ✅ `QUICK_MAINTAINABILITY_CHECK.md` - This file

---

## Need More Details?

- **Full Guide**: See `MAINTAINABILITY.md`
- **Current Issues**: See `MAINTAINABILITY_REPORT.md`
- **CI/CD Setup**: See `MAINTAINABILITY.md` → "CI/CD Integration"

---

## Summary

**To check maintainability**: Run `bash scripts/check-maintainability.sh`

**Average complexity**: 4.62 (✅ Good)

**Functions needing refactoring**: 13 with complexity > 15

**Target**: Keep average complexity < 10, refactor functions > 20

