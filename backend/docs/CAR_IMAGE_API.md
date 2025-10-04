# Car Image Upload API Documentation

## Overview

This API allows sellers to upload car images that are stored directly in the PostgreSQL database. The system supports multiple images per car with strict validation rules.

## Features

- ✅ Store images in PostgreSQL database (BYTEA)
- ✅ Minimum 5 images required to publish car
- ✅ Maximum 12 images per car
- ✅ Maximum 50MB per image
- ✅ Supported formats: JPEG, PNG, WebP, GIF
- ✅ Seller authentication required
- ✅ Sellers can only manage their own cars
- ✅ Admins can manage all cars
- ✅ Create car listing as draft, upload images, then publish
- ✅ Add images after car creation

## API Endpoints

### 1. Create Car Listing

**POST** `/api/cars`

**Authentication Required:** Yes (Seller only)

**Request Body:**
```json
{
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
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cid": 1,
    "sellerId": 1,
    "price": 500000,
    "year": 2020,
    "status": "draft",
    "createdAt": "2025-10-04T10:00:00Z",
    "updatedAt": "2025-10-04T10:00:00Z"
  },
  "message": "Car created successfully"
}
```

### 2. Upload Car Images

**POST** `/api/cars/{id}/images`

**Authentication Required:** Yes (Owner or Admin)

**Content-Type:** `multipart/form-data`

**Form Data:**
- `images`: Multiple image files (max 12 total per car)

**Example using curl:**
```bash
curl -X POST http://localhost:8080/api/cars/1/images \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "images=@car_photo_1.jpg" \
  -F "images=@car_photo_2.jpg" \
  -F "images=@car_photo_3.jpg"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "carId": 1,
    "uploadedCount": 3,
    "images": [
      {
        "id": 1,
        "carId": 1,
        "imageType": "image/jpeg",
        "imageSize": 2048000,
        "displayOrder": 0,
        "uploadedAt": "2025-10-04T10:05:00Z"
      },
      {
        "id": 2,
        "carId": 1,
        "imageType": "image/jpeg",
        "imageSize": 1856000,
        "displayOrder": 1,
        "uploadedAt": "2025-10-04T10:05:01Z"
      },
      {
        "id": 3,
        "carId": 1,
        "imageType": "image/jpeg",
        "imageSize": 1920000,
        "displayOrder": 2,
        "uploadedAt": "2025-10-04T10:05:02Z"
      }
    ]
  },
  "message": "Successfully uploaded 3 image(s)"
}
```

### 3. Get Car with Images

**GET** `/api/cars/{id}`

**Authentication Required:** No (Public)

**Response:**
```json
{
  "success": true,
  "data": {
    "car": {
      "cid": 1,
      "sellerId": 1,
      "price": 500000,
      "year": 2020,
      "mileage": 50000,
      "province": "Bangkok",
      "status": "active",
      "createdAt": "2025-10-04T10:00:00Z"
    },
    "images": [
      {
        "id": 1,
        "carId": 1,
        "imageType": "image/jpeg",
        "imageSize": 2048000,
        "displayOrder": 0,
        "uploadedAt": "2025-10-04T10:05:00Z"
      }
    ]
  }
}
```

### 4. Get Image Data

**GET** `/api/cars/images/{imageId}`

**Authentication Required:** No (Public)

**Response:** Binary image data with appropriate Content-Type header

**Example:**
```bash
curl http://localhost:8080/api/cars/images/1 -o car_image.jpg
```

Or use directly in HTML:
```html
<img src="http://localhost:8080/api/cars/images/1" alt="Car photo" />
```

### 5. Delete Car Image

**DELETE** `/api/cars/images/{imageId}`

**Authentication Required:** Yes (Owner or Admin)

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

### 6. Get My Cars

**GET** `/api/cars/my`

**Authentication Required:** Yes (Seller)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "cid": 1,
      "sellerId": 1,
      "price": 500000,
      "status": "active",
      "createdAt": "2025-10-04T10:00:00Z"
    }
  ]
}
```

### 7. Update Car

**PUT** `/api/cars/{id}`

**Authentication Required:** Yes (Owner or Admin)

**Request Body:**
```json
{
  "price": 480000,
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Car updated successfully"
}
```

### 8. Delete Car

**DELETE** `/api/cars/{id}`

**Authentication Required:** Yes (Owner or Admin)

**Response:**
```json
{
  "success": true,
  "message": "Car deleted successfully"
}
```

## Validation Rules

### Image Upload Constraints

1. **File Size**: Maximum 50MB per image
2. **Image Count**: Minimum 5 images required to publish, Maximum 12 images per car
3. **File Types**: Only JPEG, PNG, WebP, and GIF are accepted
4. **Content Type Detection**: Server validates actual file content, not just extension
5. **Publishing Rule**: Car must have at least 5 images before status can be changed to "active"

### Authorization Rules

1. **Create Car**: Only sellers can create car listings
2. **Upload Images**: Only the car owner (seller) or admin can upload images
3. **Delete Images**: Only the car owner (seller) or admin can delete images
4. **Update Car**: Only the car owner (seller) or admin can update car details
5. **Delete Car**: Only the car owner (seller) or admin can delete cars

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid image type image/pdf for file document.pdf (allowed: JPEG, PNG, WebP, GIF)"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Only sellers can create car listings"
}
```

```json
{
  "success": false,
  "error": "unauthorized: you can only upload images to your own cars"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Car not found"
}
```

### 413 Payload Too Large
```json
{
  "success": false,
  "error": "image car_photo.jpg exceeds maximum size of 50MB"
}
```

### Example: Too Many Images
```json
{
  "success": false,
  "error": "cannot upload 3 images: car already has 10 images (max 12)"
}
```

### Example: Not Enough Images to Publish
```json
{
  "success": false,
  "error": "cannot publish car: minimum 5 images required (currently has 3)"
}
```

### Example: Cannot Create Active Car Without Images
```json
{
  "success": false,
  "error": "cannot create car with 'active' status: must upload at least 5 images first"
}
```

## Database Schema

### cars table
```sql
CREATE TABLE cars (
    cid SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES sellers(id),
    year INTEGER,
    mileage INTEGER,
    price INTEGER NOT NULL,
    province VARCHAR(100),
    condition_rating INTEGER CHECK (condition_rating BETWEEN 1 AND 5),
    body_type_id INTEGER REFERENCES body_types(id),
    transmission_id INTEGER REFERENCES transmissions(id),
    fuel_type_id INTEGER REFERENCES fuel_types(id),
    drivetrain_id INTEGER REFERENCES drivetrains(id),
    seats INTEGER,
    doors INTEGER,
    color VARCHAR(50),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'sold')),
    ocr_applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### car_images table
```sql
CREATE TABLE car_images (
    id SERIAL PRIMARY KEY,
    car_id INTEGER NOT NULL REFERENCES cars(cid) ON DELETE CASCADE,
    image_data BYTEA NOT NULL,
    image_type VARCHAR(50) NOT NULL,
    image_size INTEGER NOT NULL,
    display_order INTEGER DEFAULT 0,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_image_size CHECK (image_size <= 52428800) -- 50MB
);
```

## Complete Example Workflow

### 1. Create a car listing as draft (as seller)
```bash
curl -X POST http://localhost:8080/api/cars \
  -H "Authorization: Bearer YOUR_SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 850000,
    "year": 2021,
    "mileage": 30000,
    "province": "Chiang Mai",
    "conditionRating": 5,
    "bodyTypeId": 2,
    "transmissionId": 2,
    "fuelTypeId": 1,
    "seats": 7,
    "doors": 5,
    "color": "Silver",
    "status": "draft"
  }'
```

**Important**: Cannot create with `"status": "active"` directly - must upload images first.

### 2. Upload at least 5 images (minimum required)
```bash
curl -X POST http://localhost:8080/api/cars/1/images \
  -H "Authorization: Bearer YOUR_SELLER_TOKEN" \
  -F "images=@front_view.jpg" \
  -F "images=@back_view.jpg" \
  -F "images=@interior.jpg" \
  -F "images=@dashboard.jpg" \
  -F "images=@side_view.jpg"
```

**Minimum**: 5 images required to publish  
**Maximum**: 12 images per car

### 3. Publish the car (now that we have 5+ images)
```bash
curl -X PUT http://localhost:8080/api/cars/1 \
  -H "Authorization: Bearer YOUR_SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'
```

This will succeed because the car now has 5 images (meets minimum requirement).

### 4. View the car (public)
```bash
curl http://localhost:8080/api/cars/1
```

## Docker Setup

The system runs entirely in Docker containers:

```bash
# Build and start all services
docker-compose up --build

# Backend API will be available at http://localhost:8080
# Database migrations run automatically on startup
```

## Performance Considerations

### Pros of storing images in database:
- ✅ Transactional consistency (images deleted with car)
- ✅ Simplified backup (single database backup)
- ✅ No file system permissions issues
- ✅ Works in containerized environments

### Cons:
- ❌ Larger database size
- ❌ Slower queries if not optimized
- ❌ No CDN caching by default

### Optimizations implemented:
- Cache-Control headers for image responses
- Separate metadata endpoint (without image data)
- Indexes on car_id and display_order
- Image size constraints (50MB max)

## Testing

### Using Postman
1. Import the endpoints above
2. Set Authorization header: `Bearer YOUR_TOKEN`
3. Use form-data for image uploads

### Using curl
See examples above for each endpoint

### Using JavaScript/Fetch
```javascript
// Upload images
const formData = new FormData();
formData.append('images', file1);
formData.append('images', file2);

const response = await fetch('http://localhost:8080/api/cars/1/images', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log(result);
```

## Support

For issues or questions, please refer to the main API documentation or contact the development team.

