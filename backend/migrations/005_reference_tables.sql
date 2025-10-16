-- Reference tables
-- Body types
CREATE TABLE body_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
);

-- Transmissions
CREATE TABLE transmissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
);

-- Fuel types
CREATE TABLE fuel_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
);

-- Drivetrains
CREATE TABLE drivetrains (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
);

-- Car colors
CREATE TABLE color (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    color_code VARCHAR(50) NOT NULL UNIQUE -- HEX
);

-- Seed: body types
INSERT INTO
    body_types (name)
VALUES ('Sedan'),
    ('SUV'),
    ('Hatchback'),
    ('Pickup Truck'),
    ('Coupe'),
    ('Convertible'),
    ('Van'),
    ('Wagon'),
    ('MPV');

-- Seed: transmissions
INSERT INTO
    transmissions (name)
VALUES ('Manual'),
    ('Automatic'),
    ('CVT'),
    ('DCT');

-- Seed: fuel types
INSERT INTO
    fuel_types (name)
VALUES ('Gasoline'),
    ('Diesel'),
    ('Hybrid'),
    ('Electric'),
    ('LPG'),
    ('NGV');

-- Seed: drivetrains
INSERT INTO
    drivetrains (name)
VALUES ('FWD'),
    ('RWD'),
    ('AWD'),
    ('4WD');
