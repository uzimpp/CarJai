-- Cars
CREATE TABLE cars (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES sellers (id) ON DELETE CASCADE,
    body_type_code VARCHAR(20) REFERENCES body_types (code), -- Must Enter by Seller
    transmission_code VARCHAR(10) REFERENCES transmissions (code), -- Must Enter by Seller
    drivetrain_code VARCHAR(10) REFERENCES drivetrains (code), -- Must Enter by Seller
    -- fuel types stored in car_fuel junction table
    brand_name VARCHAR(100), -- Book Uploaded
    model_name VARCHAR(100), -- Must Enter by Seller (e.g., Civic, Corolla, D-Max)
    submodel_name VARCHAR(100), -- Must Enter by Seller (e.g., EL, Sport, Hi-Lander)
    chassis_number VARCHAR(30) UNIQUE NOT NULL, -- VIN (Vehicle Identification Number) เลขถังรถ,เลขตัวรถ
    year INTEGER, -- Book Uploaded
    mileage INTEGER, -- Must Enter by Seller
    engine_cc INTEGER, -- Book Uploaded
    seats INTEGER, -- Book Uploaded
    doors INTEGER, -- Must Enter by Seller
    status VARCHAR(20) DEFAULT 'draft' CHECK (
        status IN (
            'draft',
            'active',
            'sold',
            'deleted' -- Soft delete
        )
    ), -- Must Enter by Seller
    condition_rating INTEGER CHECK (
        condition_rating BETWEEN 1 AND 5
    ), -- Must Enter by Seller
    prefix VARCHAR(10), -- Nullable for drafts; required at publish
    number VARCHAR(10), -- Nullable for drafts; required at publish
    province_id INT REFERENCES provinces (id) ON DELETE RESTRICT, -- Nullable for drafts; required at publish
    description VARCHAR(200), -- Must Enter by Seller
    price INTEGER, -- Nullable for drafts; required at publish
    is_flooded BOOLEAN DEFAULT FALSE, -- Must Enter by Seller
    is_heavily_damaged BOOLEAN DEFAULT FALSE, -- Must Enter by Seller
    book_uploaded BOOLEAN DEFAULT FALSE,
    inspection_uploaded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Car colors (many-to-many with position for ordered colors)
-- Inspection Uploaded
CREATE TABLE car_colors (
    car_id INTEGER NOT NULL REFERENCES cars (id) ON DELETE CASCADE,
    color_code VARCHAR(20) NOT NULL REFERENCES colors (code) ON DELETE RESTRICT,
    position SMALLINT NOT NULL DEFAULT 0, -- Order: 0=primary, 1=secondary, 2=tertiary
    PRIMARY KEY (car_id, color_code)
);

-- Index for ordered color queries
CREATE INDEX idx_car_colors_position ON car_colors (car_id, position);

-- Car fuel (many-to-many with fuel type)
-- Must Enter by Seller
CREATE TABLE car_fuel (
    car_id INTEGER NOT NULL REFERENCES cars (id) ON DELETE CASCADE,
    fuel_type_code VARCHAR(20) NOT NULL REFERENCES fuel_types (code) ON DELETE RESTRICT,
    PRIMARY KEY (car_id, fuel_type_code)
);

-- Car images (stored as BYTEA)
-- Must Enter by Seller
CREATE TABLE car_images (
    id SERIAL PRIMARY KEY,
    car_id INTEGER NOT NULL REFERENCES cars (id) ON DELETE CASCADE,
    image_data BYTEA NOT NULL,
    image_type VARCHAR(50) NOT NULL,
    image_size INTEGER NOT NULL,
    display_order INTEGER DEFAULT 0,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_image_size CHECK (image_size <= 52428800) -- 50MB in bytes
);

-- Car inspection results (Web scrape)
-- Inspection Uploaded
CREATE TABLE car_inspection_results (
    id SERIAL PRIMARY KEY,
    car_id INTEGER NOT NULL REFERENCES cars (id) ON DELETE CASCADE,
    station VARCHAR(200), --TH
    overall_pass BOOLEAN, -- Overall inspection result (pass/fail)
    brake_result BOOLEAN, -- Brake test (pass/fail)
    handbrake_result BOOLEAN, -- Handbrake (pass/fail)
    alignment_result BOOLEAN, -- Wheel alignment (pass/fail)
    noise_result BOOLEAN, -- Noise level (pass/fail)
    emission_result BOOLEAN, -- Emissions (pass/fail)
    horn_result BOOLEAN, -- Horn (pass/fail)
    speedometer_result BOOLEAN, -- Speedometer (pass/fail)
    high_low_beam_result BOOLEAN, -- High/low beams (pass/fail)
    signal_lights_result BOOLEAN, -- Turn/plate/brake lights (pass/fail)
    other_lights_result BOOLEAN, -- License plate/other lights (pass/fail)
    windshield_result BOOLEAN, -- Windshields/windows (pass/fail)
    steering_result BOOLEAN, -- Steering system (pass/fail)
    wheels_tires_result BOOLEAN, -- Wheels and tires (pass/fail)
    fuel_tank_result BOOLEAN, -- Fuel tank and lines (pass/fail)
    chassis_result BOOLEAN, -- Undercarriage (pass/fail)
    body_result BOOLEAN, -- Body and frame (pass/fail)
    doors_floor_result BOOLEAN, -- Doors and floor (pass/fail)
    seatbelt_result BOOLEAN, -- Seatbelts (pass/fail)
    wiper_result BOOLEAN, -- Wipers (pass/fail)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cars_seller_id ON cars (seller_id);

CREATE INDEX idx_cars_status ON cars (status);

CREATE INDEX idx_cars_price ON cars (price);

CREATE INDEX idx_cars_province_id ON cars (province_id);

CREATE INDEX idx_cars_created_at ON cars (created_at);

CREATE INDEX idx_car_images_car_id ON car_images (car_id);

CREATE INDEX idx_car_images_display_order ON car_images (car_id, display_order);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON cars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_inspection_results_car_id ON car_inspection_results (car_id);

CREATE TRIGGER update_inspection_results_updated_at BEFORE UPDATE ON car_inspection_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
