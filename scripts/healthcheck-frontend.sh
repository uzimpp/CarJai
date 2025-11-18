#!/bin/sh
# Frontend health check script
# Validates that the frontend Next.js app is responding

set -e

FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
TIMEOUT="${TIMEOUT:-5}"

# Try wget first, fall back to nc (netcat) if wget is not available
if command -v wget > /dev/null 2>&1; then
    # Check if frontend is responding
    if ! wget --no-verbose --tries=1 --timeout="$TIMEOUT" --spider "$FRONTEND_URL" > /dev/null 2>&1; then
        echo "Frontend health check failed: Cannot reach $FRONTEND_URL"
        exit 1
    fi

    # Check for HTTP 200 status
    STATUS_CODE=$(wget --no-verbose --tries=1 --timeout="$TIMEOUT" --spider --server-response "$FRONTEND_URL" 2>&1 | grep -i "HTTP/" | tail -1 | awk '{print $2}' || echo "000")

    if [ "$STATUS_CODE" != "200" ] && [ "$STATUS_CODE" != "000" ]; then
        echo "Frontend health check failed: HTTP status $STATUS_CODE"
        exit 1
    fi
elif command -v nc > /dev/null 2>&1; then
    # Fallback: check if port is listening
    if ! nc -z localhost 3000 > /dev/null 2>&1; then
        echo "Frontend health check failed: Port 3000 is not listening"
        exit 1
    fi
else
    # Last resort: check if process is running (basic check)
    if ! pgrep -f "node" > /dev/null 2>&1; then
        echo "Frontend health check failed: Node process not found"
        exit 1
    fi
fi

echo "Frontend healthy: Application responding correctly"
exit 0

