# Demo Data Seeding Script

This script seeds the database with demo cars for testing and demonstration purposes.

## What it does:

1. **Creates Demo Seller Account**
   - Email: `demo-seller@carjai.com`
   - Password: `Demo123456`
   - Creates seller profile and contact information

2. **Generates Cars** with:
   - Random brands from: Honda, Toyota, Mazda, Nissan, Mercedes Benz, BMW, Porsche, Tesla, etc.
   - Random models for each brand
   - Years: 2015-2024
   - Mileage: 10,000 - 200,000 km
   - Prices: ฿300,000 - ฿1,500,000
   - Random provinces (all 71 provinces)
   - Random body types, transmissions, drivetrains
   - 1-2 fuel types per car
   - 1-2 colors per car
   - 6-10 images per car (from `/frontend/public/assets/cars/`)
   - Inspection results (80% pass rate)
   - Status: `active` (ready to display in browse page)

## Configuration

You can easily customize the data generation by editing the **Configuration Section** at the top of `seed_demo_cars.go`:

```go
const (
    NUM_CARS_TO_CREATE = 30        // Change number of cars
    DEMO_EMAIL         = "demo-seller@carjai.com"
)

var (
    PRICE_RANGE    = [2]int{300000, 1500000}  // Price range
    YEAR_RANGE     = [2]int{2015, 2024}       // Year range
    MILEAGE_RANGE  = [2]int{10000, 200000}    // Mileage range
    // ... and more options
)
```

## How to Run
**Prerequisites:**
- PostgreSQL database running locally
- `.env` file configured in `/` directory

**Steps:**
The seed script is pre-compiled as a binary inside the backend Docker container.

**Prerequisites:**
- Docker containers running (`docker compose up -d`)

**Steps:**

```bash
# Method 1: Run the compiled binary directly
docker exec -it carjai-backend /app/scripts/seed_demo_cars

# Method 2: Use the helper script
docker exec -it carjai-backend sh /app/scripts/seed_demo_cars_docker.sh

# Method 3: Interactive shell (if you want to explore)
docker exec -it carjai-backend sh
cd /app/scripts
./seed_demo_cars
```

**Note:** The seed binary is compiled during the Docker build process, so you don't need Go installed on your machine.

## Cleaning Up Demo Data

To remove all demo cars:

```sql
-- Connect to database
psql -U carjai_user -d carjai

-- Delete demo cars
DELETE FROM cars WHERE chassis_number LIKE 'DEMO%';
```

Or via Docker:

```bash
docker exec -it carjai-database-1 psql -U carjai_user -d carjai \
  -c "DELETE FROM cars WHERE chassis_number LIKE 'DEMO%';"
```

## Requirements:

- Database must be running (local or Docker)
- `.env` file must be configured with database credentials
- Image files must exist in `frontend/public/assets/cars/`
- Go 1.24+ (for local execution)

## Notes:

- If demo seller already exists, script will reuse the existing account
- All cars will have status `active` so they appear in search results
- Images are read from the frontend directory and stored in database as BYTEA
- Chassis numbers start with `DEMO` for easy identification and deletion

