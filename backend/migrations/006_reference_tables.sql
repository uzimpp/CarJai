-- Reference tables for car specifications
CREATE TABLE body_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transmissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE fuel_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE drivetrains (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default values for body types
INSERT INTO body_types (name) VALUES
    ('Sedan'),
    ('SUV'),
    ('Hatchback'),
    ('Pickup Truck'),
    ('Coupe'),
    ('Convertible'),
    ('Van'),
    ('Wagon'),
    ('MPV');

-- Insert default values for transmissions
INSERT INTO transmissions (name) VALUES
    ('Manual'),
    ('Automatic'),
    ('CVT'),
    ('DCT');

-- Insert default values for fuel types
INSERT INTO fuel_types (name) VALUES
    ('Gasoline'),
    ('Diesel'),
    ('Hybrid'),
    ('Electric'),
    ('LPG'),
    ('NGV');

-- Insert default values for drivetrains
INSERT INTO drivetrains (name) VALUES
    ('FWD'),
    ('RWD'),
    ('AWD'),
    ('4WD');

