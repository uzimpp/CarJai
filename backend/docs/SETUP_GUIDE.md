# Car Image Upload System - Setup Guide

## Overview

This system allows sellers to upload car images that are stored directly in PostgreSQL database (BYTEA). All services run in Docker containers.

## Quick Start

### 1. Prerequisites
- Docker and Docker Compose installed
- `.env` file configured (copy from `env.example`)

### 2. Start the System
```bash
# From project root
docker-compose up --build
```

This will start:
- **PostgreSQL Database** (port 5432)
- **Backend API** (port 8080)
- **Frontend** (port 3000)

### 3. Verify Setup
```bash
# Check health
curl http://localhost:8080/health

# Check database migrations
docker-compose logs database | grep "migrations"
```

## Database Migrations

The following migrations are applied automatically on startup:

1. `001_admin_auth.sql` - Admin authentication
2. `002_user_auth.sql` - User authentication
3. `003_buyer.sql` - Buyer profiles
4. `004_seller.sql` - Seller profiles
5. `005_indexes.sql` - Database indexes
6. **`006_reference_tables.sql`** - Car reference data (body types, transmissions, etc.)
7. **`007_cars.sql`** - Cars and car_images tables

## Testing the Image Upload

### Step 1: Create a Seller Account

```bash
# Signup as a user
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seller@example.com",
    "password": "password123"
  }'

# Response will include JWT token
# Save the token from response.data.token
```

### Step 2: Create Seller Profile

```bash
curl -X POST http://localhost:8080/api/profile/seller \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "My Car Dealership",
    "about": "Quality used cars",
    "mapLink": "https://maps.google.com",
    "contacts": [
      {
        "contactType": "phone",
        "value": "0812345678",
        "label": "Main Line"
      }
    ]
  }'
```

### Step 3: Create a Car Listing

```bash
curl -X POST http://localhost:8080/api/cars \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 500000,
    "year": 2020,
    "mileage": 50000,
    "province": "Bangkok",
    "conditionRating": 4,
    "bodyTypeId": 1,
    "transmissionId": 2,
    "fuelTypeId": 1,
    "drivetrainId": 1,
    "seats": 5,
    "doors": 4,
    "color": "White",
    "status": "draft"
  }'

# Response will include car ID (cid)
```

### Step 4: Upload Images (minimum 5 required)

```bash
# Upload minimum 5 images to be able to publish
curl -X POST http://localhost:8080/api/cars/1/images \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "images=@/path/to/car_photo_1.jpg" \
  -F "images=@/path/to/car_photo_2.jpg" \
  -F "images=@/path/to/car_photo_3.jpg" \
  -F "images=@/path/to/car_photo_4.jpg" \
  -F "images=@/path/to/car_photo_5.jpg"

# Or upload one by one (total must be at least 5 before publishing)
curl -X POST http://localhost:8080/api/cars/1/images \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "images=@/path/to/another_photo.jpg"
```

**Important**: Car must have at least 5 images before you can change status to "active".

### Step 5: Publish the Car (requires 5+ images)

```bash
# Change status to active (will fail if less than 5 images)
curl -X PUT http://localhost:8080/api/cars/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'
```

### Step 6: View the Car

```bash
# Get car with image metadata
curl http://localhost:8080/api/cars/1

# Get actual image data
curl http://localhost:8080/api/cars/images/1 -o downloaded_image.jpg
```

## Image Upload Specifications

### Image Requirements
- **Minimum images to publish**: 5 (required before car can be set to "active" status)
- **Maximum images per car**: 12
- **File size per image**: 50MB
- **Total upload size**: 600MB (12 × 50MB)

### Supported Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)

### Validation
- Content-Type validation (not just file extension)
- File size checked before upload
- Image count validated per car
- Only car owner or admin can upload

## Reference Data

Default values are seeded in the database:

### Body Types
1. Sedan
2. SUV
3. Hatchback
4. Pickup Truck
5. Coupe
6. Convertible
7. Van
8. Wagon
9. MPV

### Transmissions
1. Manual
2. Automatic
3. CVT
4. DCT

### Fuel Types
1. Gasoline
2. Diesel
3. Hybrid
4. Electric
5. LPG
6. NGV

### Drivetrains
1. FWD
2. RWD
3. AWD
4. 4WD

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/cars` | Seller | Create car listing |
| GET | `/api/cars/{id}` | Public | Get car with images |
| GET | `/api/cars/my` | Seller | Get my cars |
| PUT | `/api/cars/{id}` | Owner/Admin | Update car |
| DELETE | `/api/cars/{id}` | Owner/Admin | Delete car |
| POST | `/api/cars/{id}/images` | Owner/Admin | Upload images |
| GET | `/api/cars/images/{id}` | Public | Get image data |
| DELETE | `/api/cars/images/{id}` | Owner/Admin | Delete image |

## Database Storage

Images are stored in the `car_images` table:

```sql
SELECT 
    id,
    car_id,
    image_type,
    image_size,
    display_order,
    LENGTH(image_data) as actual_size,
    uploaded_at
FROM car_images
WHERE car_id = 1
ORDER BY display_order;
```

## Troubleshooting

### Issue: "Failed to upload image"
- Check file size is under 50MB
- Verify file format is supported
- Ensure car exists and you're the owner

### Issue: "Cannot upload X images: car already has Y images"
- Delete some existing images first
- Maximum is 12 images per car

### Issue: "Cannot publish car: minimum 5 images required"
- Upload more images to reach minimum of 5
- Check current image count via GET `/api/cars/{id}`
- Car status can only be changed to "active" after uploading at least 5 images

### Issue: "Unauthorized"
- Verify JWT token is valid
- Check that you're logged in as a seller
- Token format: `Authorization: Bearer YOUR_TOKEN`

### Issue: "Only sellers can create car listings"
- Create seller profile first via `/api/profile/seller`
- Verify seller profile is complete

## Performance Tips

### For Development
- Use smaller test images (1-5MB)
- Remember minimum 5 images required to publish
- Test with exactly 5 images first, then add more

### For Production
- Consider implementing image compression before upload
- Use pagination when listing cars with many images
- Implement caching for frequently accessed images
- Monitor database size growth

## Docker Commands

```bash
# Rebuild backend only
docker-compose up --build backend

# View backend logs
docker-compose logs -f backend

# Access database
docker-compose exec database psql -U carjai_user -d carjai

# Check database size
docker-compose exec database psql -U carjai_user -d carjai -c "
  SELECT 
    pg_size_pretty(pg_total_relation_size('car_images')) as images_size,
    COUNT(*) as total_images
  FROM car_images;
"

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v
```

## Security Considerations

1. **Authentication**: All upload/delete operations require valid JWT
2. **Authorization**: Users can only manage their own cars (except admins)
3. **File Validation**: Content-Type checked, not just extension
4. **Size Limits**: Enforced at application and database level
5. **SQL Injection**: Using parameterized queries

## Next Steps

1. Review the full API documentation: `CAR_IMAGE_API.md`
2. Test all endpoints using Postman or curl
3. Integrate with frontend application
4. Monitor database size as images are uploaded
5. Consider implementing image optimization

## Support

For detailed API documentation, see:
- `CAR_IMAGE_API.md` - Complete API reference
- `API.md` - General API documentation
- `TESTING.md` - Testing guidelines

