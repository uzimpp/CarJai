#!/bin/bash

# Script สำหรับรัน tests ใน Docker container

set -e

echo "🚀 Starting integration tests..."

# Check if we're in Docker or local
if [ -f "/.dockerenv" ] || [ -n "$DOCKER_CONTAINER" ]; then
    echo "📦 Running in Docker container"
    cd /app/backend || cd backend
    
    # Run integration tests
    echo "🧪 Running integration tests..."
    go test ./tests/integration/... -v
    
    # Run unit tests
    echo "🧪 Running unit tests..."
    go test ./tests/handlers/... -v
    
    echo "✅ All tests completed!"
else
    echo "🐳 Running via Docker Compose"
    
    # Run integration tests
    echo "🧪 Running integration tests..."
    docker compose exec backend sh -c "cd /app/backend && go test ./tests/integration/... -v"
    
    # Run unit tests  
    echo "🧪 Running unit tests..."
    docker compose exec backend sh -c "cd /app/backend && go test ./tests/handlers/... -v"
    
    echo "✅ All tests completed!"
fi

