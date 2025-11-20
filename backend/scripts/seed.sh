#!/bin/sh

# Unified Seeding Script - Docker Version
# This script runs the compiled seed binary inside the Docker container
# 
# Usage from host machine:
#   docker exec -it carjai-backend sh /app/scripts/seed.sh [options]
#
# Examples:
#   docker exec -it carjai-backend sh /app/scripts/seed.sh --all
#   docker exec -it carjai-backend sh /app/scripts/seed.sh --users --cars
#   docker exec -it carjai-backend sh /app/scripts/seed.sh --market-price

set -e

echo "Starting demo data seeding in Docker..."
echo "==========================================="
echo ""

# Run the compiled seed binary with all passed arguments
/app/scripts/seed "$@"

echo ""
echo "Seeding completed successfully!"
echo "==========================================="

