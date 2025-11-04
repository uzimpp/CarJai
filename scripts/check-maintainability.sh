#!/bin/bash

# CarJai Maintainability Check Script
# This script checks the maintainability of both backend and frontend code
# Calculates: Cyclomatic Complexity, Halstead Volume, and Lines of Code

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== CarJai Maintainability Check ===${NC}"
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Add Go bin directory to PATH
export PATH="$HOME/go/bin:$PATH"

# Track overall status
OVERALL_STATUS=0

# Check backend
echo -e "${BLUE}--- Go Backend Metrics ---${NC}"
cd "$PROJECT_DIR/backend"

# 1. Lines of Code (LOC)
echo -e "${CYAN}[1/3] Calculating Lines of Code...${NC}"
CODE_LOC=0
TOTAL_LOC=0
GO_FILES=0

if command -v cloc &> /dev/null; then
    echo "Using cloc for accurate line counting:"
    cloc --quiet --by-file-by-lang . 2>/dev/null | tail -1 || true
    TOTAL_LOC=$(cloc --quiet . 2>/dev/null | grep "SUM:" | awk '{print $5}' || echo "0")
    CODE_LOC=$(cloc --quiet --exclude-dir=vendor . 2>/dev/null | grep "Go" | awk '{print $5}' || echo "0")
    echo -e "${GREEN}Total LOC: $TOTAL_LOC | Go Code LOC: $CODE_LOC${NC}"
elif command -v tokei &> /dev/null; then
    echo "Using tokei for line counting:"
    tokei . 2>/dev/null || true
    CODE_LOC=$(tokei -t Go . 2>/dev/null | grep "Total" | awk '{print $NF}' || echo "0")
    echo -e "${GREEN}Go Code LOC: $CODE_LOC${NC}"
else
    # Fallback: simple line count
    GO_FILES=$(find . -name "*.go" -not -path "./vendor/*" -not -path "*/.*" 2>/dev/null | wc -l | xargs)
    TOTAL_LINES=$(find . -name "*.go" -not -path "./vendor/*" -not -path "*/.*" -exec cat {} \; 2>/dev/null | wc -l | xargs)
    CODE_LINES=$(find . -name "*.go" -not -path "./vendor/*" -not -path "*/.*" -exec grep -v "^[[:space:]]*$" {} \; 2>/dev/null | grep -v "^[[:space:]]*//" | wc -l | xargs)
    CODE_LOC=$CODE_LINES
    echo -e "${YELLOW}Go files: $GO_FILES | Total lines: $TOTAL_LINES | Code lines (excl. blanks/comments): $CODE_LINES${NC}"
fi

# 2. Cyclomatic Complexity
echo ""
echo -e "${CYAN}[2/3] Calculating Cyclomatic Complexity...${NC}"
COMPLEXITY_OUTPUT=""
TOTAL_COMPLEXITY=0
FUNCTION_COUNT=0
AVG_COMPLEXITY=0

if command -v gocyclo &> /dev/null; then
    echo "Checking cyclomatic complexity..."
    
    # Get complexity report
    COMPLEXITY_OUTPUT=$(gocyclo -over 0 . 2>/dev/null || true)
    
    # Calculate average complexity
    if [ -n "$COMPLEXITY_OUTPUT" ]; then
        while IFS= read -r line; do
            COMPLEXITY=$(echo "$line" | awk '{print $1}')
            if [[ "$COMPLEXITY" =~ ^[0-9]+$ ]]; then
                TOTAL_COMPLEXITY=$((TOTAL_COMPLEXITY + COMPLEXITY))
                FUNCTION_COUNT=$((FUNCTION_COUNT + 1))
            fi
        done <<< "$COMPLEXITY_OUTPUT"
        
        if [ "$FUNCTION_COUNT" -gt 0 ]; then
            AVG_COMPLEXITY=$(echo "scale=2; $TOTAL_COMPLEXITY / $FUNCTION_COUNT" | bc 2>/dev/null || echo "0")
            echo -e "${GREEN}Total functions: $FUNCTION_COUNT | Average complexity: $AVG_COMPLEXITY${NC}"
        fi
    fi
    
    # Check for high complexity functions (>15)
    HIGH_COMPLEX=$(echo "$COMPLEXITY_OUTPUT" | awk '{if ($1 > 15) print $0}' | wc -l | xargs)
    
    if [ "$HIGH_COMPLEX" -gt 0 ]; then
        echo -e "${RED}⚠ Found $HIGH_COMPLEX function(s) with complexity > 15${NC}"
        echo -e "${YELLOW}High complexity functions:${NC}"
        echo "$COMPLEXITY_OUTPUT" | awk '{if ($1 > 15) print $0}'
        OVERALL_STATUS=1
    else
        echo -e "${GREEN}✓ No functions with excessive complexity${NC}"
    fi
    
    # Save complexity data for later
    echo "$COMPLEXITY_OUTPUT" > /tmp/gocyclo_output.txt 2>/dev/null || true
else
    echo -e "${YELLOW}gocyclo not installed${NC}"
    echo "Install with: ${GREEN}go install github.com/fzipp/gocyclo/cmd/gocyclo@latest${NC}"
fi

# 3. Halstead Volume
echo ""
echo -e "${CYAN}[3/3] Calculating Halstead Volume...${NC}"
ESTIMATED_HALSTEAD=""
if command -v lizard &> /dev/null; then
    echo "Using lizard for Halstead metrics:"
    lizard -l go . 2>/dev/null | grep -A 10 "Total" || true
elif command -v gocomplex &> /dev/null; then
    echo "Using gocomplex for Halstead metrics:"
    gocomplex . 2>/dev/null || true
else
    # Note: Halstead requires parsing source code for operators and operands
    # This is a simplified estimation based on complexity and LOC
    if [ -n "$COMPLEXITY_OUTPUT" ] && [ "$FUNCTION_COUNT" -gt 0 ] && [ -n "$CODE_LOC" ] && [ "$CODE_LOC" -gt 0 ] && [ -n "$AVG_COMPLEXITY" ] && [ "$AVG_COMPLEXITY" != "0" ]; then
        # Estimate Halstead Volume: V = N * log2(n)
        # Rough estimation: N ≈ LOC, n ≈ distinct tokens (estimated from complexity)
        ESTIMATED_VOCAB=$(echo "scale=0; $AVG_COMPLEXITY * 3" | bc 2>/dev/null || echo "10")
        if [ "$ESTIMATED_VOCAB" -lt 10 ]; then ESTIMATED_VOCAB=10; fi
        ESTIMATED_HALSTEAD=$(echo "scale=2; $CODE_LOC * l($ESTIMATED_VOCAB)/l(2)" | bc -l 2>/dev/null || echo "0")
        echo -e "${YELLOW}Estimated Halstead Volume: $ESTIMATED_HALSTEAD${NC}"
        echo -e "${YELLOW}(Note: Install 'lizard' for accurate Halstead metrics)${NC}"
        echo "  Install: ${GREEN}pip install lizard${NC} or ${GREEN}brew install lizard${NC}"
    else
        echo -e "${YELLOW}Halstead calculation requires lizard or gocomplex${NC}"
        echo "Install with: ${GREEN}pip install lizard${NC} or ${GREEN}brew install lizard${NC}"
        echo "  (or ensure LOC and complexity metrics are calculated first)"
    fi
fi

# Check gofmt
if command -v gofmt &> /dev/null; then
    echo ""
    echo "Checking code formatting..."
    FMT_OUTPUT=$(gofmt -l . 2>/dev/null || true)
    if [ -n "$FMT_OUTPUT" ]; then
        echo -e "${RED}⚠ Some files need formatting${NC}"
        echo "$FMT_OUTPUT"
        OVERALL_STATUS=1
    else
        echo -e "${GREEN}✓ All files properly formatted${NC}"
    fi
fi

# Try to run golangci-lint if available
if command -v golangci-lint &> /dev/null; then
    echo ""
    echo "Running golangci-lint..."
    golangci-lint run || OVERALL_STATUS=1
fi

cd "$PROJECT_DIR"

# Check frontend
echo ""
echo -e "${BLUE}--- TypeScript Frontend ---${NC}"
cd "$PROJECT_DIR/frontend"

if command -v npm &> /dev/null; then
    echo "Running ESLint..."
    if npm run lint 2>/dev/null; then
        echo -e "${GREEN}✓ Linting passed${NC}"
    else
        echo -e "${RED}⚠ Linting issues found${NC}"
        OVERALL_STATUS=1
    fi
else
    echo -e "${YELLOW}npm not available${NC}"
fi

cd "$PROJECT_DIR"

# Summary
echo ""
echo -e "${BLUE}=== Metrics Summary ===${NC}"
echo -e "${CYAN}Backend Metrics:${NC}"
echo -e "  ${GREEN}Lines of Code (LOC):${NC} $CODE_LOC"
echo -e "  ${GREEN}Cyclomatic Complexity (CC):${NC} Avg: $AVG_COMPLEXITY (across $FUNCTION_COUNT functions)"

HALSTEAD_VOLUME=""
if [ -n "$ESTIMATED_HALSTEAD" ] && [ "$ESTIMATED_HALSTEAD" != "0" ]; then
    HALSTEAD_VOLUME=$ESTIMATED_HALSTEAD
    echo -e "  ${GREEN}Halstead Volume (HV):${NC} $HALSTEAD_VOLUME (estimated)"
elif command -v lizard &> /dev/null || command -v gocomplex &> /dev/null; then
    echo -e "  ${GREEN}Halstead Volume (HV):${NC} Calculated (see above)"
    # Try to extract from lizard output if available
    if command -v lizard &> /dev/null; then
        HALSTEAD_OUTPUT=$(lizard -l go . 2>/dev/null | grep -i "halstead" || true)
        if [ -n "$HALSTEAD_OUTPUT" ]; then
            HALSTEAD_VOLUME=$(echo "$HALSTEAD_OUTPUT" | grep -oE '[0-9]+\.[0-9]+' | head -1 || echo "")
        fi
    fi
else
    echo -e "  ${YELLOW}Halstead Volume (HV):${NC} Not calculated (install lizard for accurate metrics)"
fi

# Calculate Maintainability Index (MI)
# Formula: MI = 171 - 5.2*ln(HV) - 0.23*CC - 16.2*ln(LOC)
echo ""
echo -e "${BLUE}=== Maintainability Index (MI) ===${NC}"
if [ -n "$CODE_LOC" ] && [ "$CODE_LOC" -gt 0 ] && [ -n "$AVG_COMPLEXITY" ] && [ "$AVG_COMPLEXITY" != "0" ] && [ -n "$HALSTEAD_VOLUME" ] && [ "$HALSTEAD_VOLUME" != "0" ]; then
    # Calculate MI using the formula
    # MI = 171 - 5.2*ln(HV) - 0.23*CC - 16.2*ln(LOC)
    LN_HV=$(echo "l($HALSTEAD_VOLUME)" | bc -l 2>/dev/null || echo "0")
    LN_LOC=$(echo "l($CODE_LOC)" | bc -l 2>/dev/null || echo "0")
    TERM1=$(echo "5.2 * $LN_HV" | bc -l 2>/dev/null || echo "0")
    TERM2=$(echo "0.23 * $AVG_COMPLEXITY" | bc -l 2>/dev/null || echo "0")
    TERM3=$(echo "16.2 * $LN_LOC" | bc -l 2>/dev/null || echo "0")
    MI=$(echo "171 - $TERM1 - $TERM2 - $TERM3" | bc -l 2>/dev/null | awk '{printf "%.2f", $1}')
    
    # Interpret MI score
    MI_INT=$(echo "$MI" | awk '{print int($1)}')
    if [ "$MI_INT" -ge 70 ]; then
        MI_STATUS="${GREEN}High MI${NC}"
        MI_DESC="Code is relatively easy to maintain"
    elif [ "$MI_INT" -ge 50 ]; then
        MI_STATUS="${YELLOW}Moderate MI${NC}"
        MI_DESC="Medium complexity - could use improvement"
    else
        MI_STATUS="${RED}Low MI${NC}"
        MI_DESC="Requires immediate refactoring"
    fi
    
    echo -e "  ${CYAN}MI Score:${NC} $MI"
    echo -e "  ${CYAN}Status:${NC} $MI_STATUS ($MI_DESC)"
    echo ""
    echo -e "  ${YELLOW}MI Interpretation:${NC}"
    echo -e "    ${GREEN}High MI (≥70):${NC} Easy to maintain, low complexity"
    echo -e "    ${YELLOW}Moderate MI (50-69):${NC} Medium complexity, needs some improvement"
    echo -e "    ${RED}Low MI (<50):${NC} High complexity, requires refactoring"
elif [ -z "$HALSTEAD_VOLUME" ] || [ "$HALSTEAD_VOLUME" = "0" ]; then
    echo -e "${YELLOW}Cannot calculate MI: Halstead Volume not available${NC}"
    echo "  Install lizard or gocomplex for accurate MI calculation"
else
    echo -e "${YELLOW}Cannot calculate MI: Missing required metrics${NC}"
fi

echo ""
echo -e "${BLUE}=== Check Complete ===${NC}"
if [ $OVERALL_STATUS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Some issues found - review recommended${NC}"
    exit 1
fi

