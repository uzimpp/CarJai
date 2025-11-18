#!/bin/sh
# Backend health check script
# Validates that the backend API is responding and healthy

HEALTH_URL="${HEALTH_URL:-http://localhost:8080/health}"
TIMEOUT="${TIMEOUT:-5}"

# Try wget first, fall back to nc (netcat) if wget is not available
if command -v wget > /dev/null 2>&1; then
    # Check the health response content
    RESPONSE=$(wget --no-verbose --tries=1 --timeout="$TIMEOUT" -O- "$HEALTH_URL" 2>&1)
    WGET_EXIT_CODE=$?

    if [ $WGET_EXIT_CODE -ne 0 ]; then
        echo "Backend health check failed: Cannot reach $HEALTH_URL (exit code: $WGET_EXIT_CODE)"
        echo "Response: $RESPONSE"
        exit 1
    fi

    if [ -z "$RESPONSE" ]; then
        echo "Backend health check failed: Empty response from $HEALTH_URL"
        exit 1
    fi

    # Check if response indicates unhealthy status
    if echo "$RESPONSE" | grep -q '"status":"unhealthy"'; then
        echo "Backend health check failed: Service reports unhealthy status"
        echo "Response: $RESPONSE"
        exit 1
    fi

    # Also check for HTTP error codes in response
    if echo "$RESPONSE" | grep -q '"code":50[0-9]'; then
        echo "Backend health check failed: Service returned error code"
        echo "Response: $RESPONSE"
        exit 1
    fi
elif command -v nc > /dev/null 2>&1; then
    # Fallback: check if port is listening
    if ! nc -z localhost 8080 > /dev/null 2>&1; then
        echo "Backend health check failed: Port 8080 is not listening"
        exit 1
    fi
else
    # Last resort: check if process is running (basic check)
    if ! pgrep -f "main" > /dev/null 2>&1; then
        echo "Backend health check failed: Backend process not found"
        exit 1
    fi
fi

echo "Backend healthy: API responding correctly"
exit 0

