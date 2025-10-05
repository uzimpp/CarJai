-- Cars table for car listings
CREATE TABLE cars (
    cid SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
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

-- Car images table - stores images in database as BYTEA
CREATE TABLE car_images (
    id SERIAL PRIMARY KEY,
    car_id INTEGER NOT NULL REFERENCES cars(cid) ON DELETE CASCADE,
    image_data BYTEA NOT NULL,
    image_type VARCHAR(50) NOT NULL,
    image_size INTEGER NOT NULL,
    display_order INTEGER DEFAULT 0,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_image_size CHECK (image_size <= 52428800) -- 50MB in bytes
);

-- Car details table (registration data)
CREATE TABLE car_details (
    cdid SERIAL PRIMARY KEY,
    car_id INTEGER NOT NULL REFERENCES cars(cid) ON DELETE CASCADE UNIQUE,
    brand_name VARCHAR(100),
    model_name VARCHAR(100),
    registration_number VARCHAR(50),
    issue_date DATE,
    chassis_number VARCHAR(100),
    engine_number VARCHAR(100),
    vehicle_type VARCHAR(50),
    weight DECIMAL(10, 2),
    owner_name VARCHAR(200),
    registration_office VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_cars_seller_id ON cars(seller_id);
CREATE INDEX idx_cars_status ON cars(status);
CREATE INDEX idx_cars_price ON cars(price);
CREATE INDEX idx_cars_province ON cars(province);
CREATE INDEX idx_cars_created_at ON cars(created_at);
CREATE INDEX idx_car_images_car_id ON car_images(car_id);
CREATE INDEX idx_car_images_display_order ON car_images(car_id, display_order);
CREATE INDEX idx_car_details_car_id ON car_details(car_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON cars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

