#!/bin/sh
# Database health check script
# Validates that PostgreSQL is ready and all required tables exist

set -e

# Check if PostgreSQL is ready
if ! pg_isready -U "${POSTGRES_USER:-carjai_user}" -d "${POSTGRES_DB:-carjai}" > /dev/null 2>&1; then
    echo "PostgreSQL is not ready"
    exit 1
fi

# Required tables for migration validation
# Check if all critical tables exist
TABLE_COUNT=$(psql -U "${POSTGRES_USER:-carjai_user}" -d "${POSTGRES_DB:-carjai}" -tc "
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'admins', 'admin_sessions', 'admin_ip_whitelist',
        'users', 'user_sessions',
        'sellers', 'seller_contacts', 'buyers',
        'cars', 'car_images', 'car_inspection_results',
        'market_price', 'recent_views', 'favourites', 'reports'
    )
" | tr -d ' ')

# Expected minimum number of tables (adjust based on your migrations)
EXPECTED_MIN=15

if [ -z "$TABLE_COUNT" ] || [ "$TABLE_COUNT" -lt "$EXPECTED_MIN" ]; then
    echo "Migration validation failed: Found $TABLE_COUNT tables, expected at least $EXPECTED_MIN"
    echo "Missing tables may indicate incomplete migrations"
    exit 1
fi

echo "Database healthy: PostgreSQL ready, $TABLE_COUNT required tables present"
exit 0

