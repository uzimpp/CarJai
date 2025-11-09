#!/bin/sh

# Seed Demo Cars - Docker Version
# This script runs the compiled seed binary inside the Docker container
# 
# Usage from host machine:
#   docker exec -it carjai-backend sh /app/scripts/seed_demo_cars_docker.sh
#
# Or from project root:
#   docker exec -it carjai-backend /app/scripts/seed_demo_cars

set -e

echo "Starting demo data seeding in Docker..."
echo "==========================================="
echo ""

# Run the compiled seed binary
/app/scripts/seed_demo_cars

echo ""
echo "Seeding completed successfully!"
echo "==========================================="
echo ""
echo "You can now browse cars at http://localhost:3000/browse"

