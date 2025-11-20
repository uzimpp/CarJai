# Unified Seeding System

This directory contains a flexible, unified seeding system for populating the CarJai database with demo/test data.

## Overview

The unified seeding system (`seed.go`) consolidates all seeding operations into a single CLI tool with command-line flags to control what gets seeded. This replaces the previous separate scripts while maintaining backward compatibility.


## Features

- **Unified CLI**: Single entry point for all seeding operations
- **Flexible Options**: Run everything or select specific data types
- **Proper Password Hashing**: Uses actual bcrypt hashing (not hardcoded)
- **Real Data Relationships**: Reports, favorites, and recent views reference existing seeded data
- **Market Price Extraction**: Uses existing PDF extraction service
- **Backward Compatible**: Legacy scripts still available

## Usage

### Quick Start

**Seed everything (recommended for first time):**
```bash
docker exec -it carjai-backend /app/scripts/seed --all
```

**Or use the helper script:**
```bash
docker exec -it carjai-backend sh /app/scripts/seed.sh --all
```

### Common Commands

```bash
# Seed only users and cars
docker exec -it carjai-backend /app/scripts/seed --users --cars

# Seed only market prices
docker exec -it carjai-backend /app/scripts/seed --market-price

# Seed reports and favorites
docker exec -it carjai-backend /app/scripts/seed --reports --favorites

# Seed everything except market prices
docker exec -it carjai-backend /app/scripts/seed --users --cars --reports --favorites --recent-views
```

### View Help

```bash
docker exec -it carjai-backend /app/scripts/seed
# Shows usage and all available options
```

**Note:** Seeding is designed to run only in Docker containers. The scripts use the same database connection logic as the main application, ensuring consistency.

### Available Options

- `--all` - Seed everything (users, cars, reports, favorites, recent-views, market-price)
- `--users` - Seed users, sellers, and buyers
- `--cars` - Seed cars with images and inspections
- `--reports` - Seed reports (car and seller reports)
- `--favorites` - Seed favorites (users favoriting cars)
- `--recent-views` - Seed recent views (users viewing cars)
- `--market-price` - Seed market prices from PDF

## What Gets Seeded

### Users (`--users`)
- Creates 60 demo users (45 buyers, 15 sellers)
- All users have password: `Demo1234` (properly hashed with bcrypt)
- Sellers have seller profiles with contact information
- Buyers have buyer profiles with province and budget ranges
- Each user gets a demo session for testing

### Cars (`--cars`)
- Creates 30 demo cars
- Random brands, models, years (2015-2024)
- Includes images, fuel types, colors, and inspection results
- All cars have status `active` (visible in browse page)
- Chassis numbers start with `DEMO` for easy identification

### Reports (`--reports`)
- Creates 50 reports (70% car reports, 30% seller reports)
- Mix of statuses: pending, reviewed, resolved, dismissed
- References existing seeded users, cars, and sellers
- Realistic topics and descriptions

### Favorites (`--favorites`)
- Buyers favorite 10-30 random cars each
- Only buyers can favorite cars (not sellers)
- References existing buyers and cars
- Spread over last 30 days

### Recent Views (`--recent-views`)
- Buyers view 5-20 random cars each
- Only buyers view cars (not sellers)
- Multiple views per car (respecting unique constraints)
- Spread over last 30 days
- References existing buyers and cars

### Market Prices (`--market-price`)
- Extracts market prices from `backend/tests/price2568.pdf`
- Uses existing `ExtractionService` for PDF processing
- Inserts/updates market price data in database

## Dependencies

The seeding system respects data dependencies:
- **Reports** require: users, cars, sellers (seed users and cars first)
- **Favorites** require: users, cars (seed users and cars first)
- **Recent Views** require: users, cars (seed users and cars first)
- **Market Prices** are independent (can be seeded alone)

When using `--all`, data is seeded in the correct order automatically.

## Configuration

You can modify seeding behavior by editing constants in the respective files:

- `seed_users.go`: `NUM_USERS_TO_CREATE`, `SELLER_BUYER_RATIO_DIVISOR`
- `seed_cars.go`: `NUM_CARS_TO_CREATE`, price/year/mileage ranges, etc.
- `seed_reports.go`: `NUM_REPORTS_TO_CREATE`
- `seed_favorites.go`: `MIN_FAVORITES_PER_USER`, `MAX_FAVORITES_PER_USER`
- `seed_recent_views.go`: `MIN_VIEWS_PER_USER`, `MAX_VIEWS_PER_USER`

## File Structure

```
backend/scripts/
├── seed.go                    # Main unified seeding CLI
├── seed_users.go              # User/seller/buyer seeding
├── seed_cars.go               # Car seeding
├── seed_reports.go            # Report seeding
├── seed_favorites.go          # Favorite seeding
├── seed_recent_views.go       # Recent views seeding
├── seed_market_price.go       # Market price seeding
├── common.go                  # Shared utilities (uses config package for DB connection)
├── seed.sh                    # Helper script for Docker execution
└── README.md                  # This file

Note: `price2568.pdf` is located in `backend/tests/` directory (mounted as volume in Docker at `/app/tests/price2568.pdf`)
```

## Cleaning Up Demo Data

To remove all demo data:

```sql
-- Connect to database
psql -U carjai_user -d carjai

-- Delete demo cars (identified by chassis_number starting with 'DEMO')
DELETE FROM cars WHERE chassis_number LIKE 'DEMO%';

-- Delete demo users (identified by email domain)
DELETE FROM users WHERE email LIKE '%@demo.com';

-- Delete demo seller
DELETE FROM users WHERE email = 'demo-seller@demo.com';
```

Or via Docker:

```bash
docker exec -it carjai-database-1 psql -U carjai_user -d carjai \
  -c "DELETE FROM cars WHERE chassis_number LIKE 'DEMO%';"

docker exec -it carjai-database-1 psql -U carjai_user -d carjai \
  -c "DELETE FROM users WHERE email LIKE '%@demo.com' OR email = 'seller@demo.com';"
```

## Requirements

- **Docker containers must be running** (`docker compose up -d`)
- Database service must be healthy (check with `docker compose ps`)
- Environment variables configured in `.env` file (used by Docker)
- Image files must exist in `frontend/public/assets/cars/` (for car seeding)
- PDF file must exist at `backend/tests/price2568.pdf` (mounted as volume in Docker)

## Notes

- **Docker Only**: Seeding is designed to run only in Docker containers using the same database connection logic as the main application
- **Database Connection**: Uses `config.LoadDatabaseConfig()` and `GetConnectionString()` - same as main app
- All demo users have the same password: `Demo1234` (properly hashed with `utils.HashPassword()`)
- Demo seller email: `seller@demo.com`
- Demo buyer email: `buyer@demo.com`
- All demo users use email domain: `demo.com`
- All cars have status `active` so they appear in search results
- Images are read from the frontend directory and stored in database as BYTEA
- Chassis numbers start with `DEMO` for easy identification and deletion
- Data relationships are maintained (reports reference existing users/cars/sellers)
- **Market Price PDF**: Located in `backend/tests/price2568.pdf` and mounted as a volume in Docker at `/app/tests/price2568.pdf` (no rebuild needed to update PDF)
