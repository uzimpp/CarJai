-- Body types
CREATE TABLE body_types (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE, -- e.g., PICKUP, SUV, CITYCAR, etc.
    name_th VARCHAR(50) NOT NULL,
    name_en VARCHAR(50) NOT NULL
);

-- Transmissions
CREATE TABLE transmissions (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE, -- MANUAL, AT, CVT, ECVT, DCT, AMT, SINGLE_SPEED
    name_th VARCHAR(50) NOT NULL,
    name_en VARCHAR(50) NOT NULL
);

-- Fuels
CREATE TABLE fuel_types (
    code TEXT PRIMARY KEY,
    label_th TEXT NOT NULL,
    label_en TEXT NOT NULL
);

-- Drivetrains
CREATE TABLE drivetrains (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE, -- FWD, RWD, AWD, 4WD
    name_th VARCHAR(50) NOT NULL,
    name_en VARCHAR(50) NOT NULL
);

-- Colors
CREATE TABLE colors (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE, -- RED, SILVER, GRAY, WHITE, BLACK, ...
    label_th TEXT NOT NULL,
    label_en TEXT NOT NULL
);

-- Suggested seeds
INSERT INTO
    body_types (code, name_th, name_en)
VALUES (
        'PICKUP', --Pickup Truck
        'กระบะ',
        'Pickup'
    ),
    (
        'VAN', -- Van
        'รถตู้',
        'Van'
    ),
    (
        'CITYCAR', -- City Car
        'รถเล็ก / รถในเมือง',
        'City Car'
    ),
    (
        'DAILY', -- Sedan, Hatchback, etc.
        'รถใช้งานประจำวัน',
        'Daily Use'
    ),
    (
        'SUV', -- SUV, Crossover, , PPV
        'รถอเนกประสงค์',
        'SUV'
    ),
    (
        'SPORTLUX', -- Coupe, Convertible, Sport, Luxury Sedan, Muscle Car, Super Car, etc.
        'รถสปอร์ต / หรู',
        'Sport / Luxury'
    );

INSERT INTO
    transmissions (code, name_th, name_en)
VALUES (
        'MANUAL',
        'เกียร์ธรรมดา',
        'Manual'
    ),
    (
        'AT',
        'เกียร์อัตโนมัติ',
        'Automatic'
    );

INSERT INTO
    fuel_types (code, label_th, label_en)
VALUES (
        'GASOLINE',
        'เบนซิน',
        'Gasoline'
    ),
    ('DIESEL', 'ดีเซล', 'Diesel'),
    ('LPG', 'ก๊าซ LPG', 'LPG'),
    ('CNG', 'ก๊าซ NGV/CNG', 'CNG'),
    ('HYBRID', 'ไฮบริด', 'Hybrid'),
    (
        'ELECTRIC',
        'ไฟฟ้า',
        'Electric'
    );

INSERT INTO drivetrains (code, name_th, name_en) VALUES
('FWD', 'ขับหน้า', 'FWD'),
    ('RWD', 'ขับหลัง', 'RWD'),
    ('AWD', 'ขับทุกล้อ (AWD)', 'AWD'),
    ('4WD', 'ขับสี่ล้อ (4WD)', '4WD');

INSERT INTO colors (code, label_th, label_en) VALUES
    ('RED', 'สีแดง', 'Red'), -- Includes สีแดงเลือดหมู, สีแดงเลือดนก, สีแดงบานเย็น, สีแดงทับทิม
    ('GRAY', 'สีเทา', 'Gray'), -- Includes สีเทาอ่อน, สีเทาออกดำ, สีบรอนซ์เงิน, สีตะกั่วตัด
    ('BLUE', 'สีน้ำเงิน', 'Blue'), -- Includes สีน้ำเงินเข้ม, สีคราม, สีกรมท่า
    ( 'LIGHT_BLUE', 'สีฟ้า', 'Light Blue'), -- Includes สีฟ้าอ่อน, สีฟ้าเข้ม
    ('YELLOW', 'สีเหลือง', 'Yellow'), -- Includes สีเหลืองอ่อน, สีเหลืองทอง, สีครีมออกเหลือง
    ('PINK', 'สีชมพู', 'Pink'), -- Includes สีชมพูอ่อน, สีชมพูเข้ม
    ('WHITE', 'สีขาว', 'White'), -- Includes สีขาวงาช้าง, สีครีมออกขาว
    ('BROWN', 'สีน้ำตาล', 'Brown'), -- Includes สีน้ำตาลอ่อน, สีน้ำตาลไหม้, สีน้ำตาลเข้ม, สีแชล็ค
    ('BLACK', 'สีดำ', 'Black'), -- Includes สีดำออกเทา
    ('ORANGE', 'สีส้ม', 'Orange'), -- Includes สีแสด, สีอิฐ, สีปูนแห้ง
    ('PURPLE', 'สีม่วง', 'Purple'), -- Includes สีม่วงอ่อน, สีม่วงเข้ม, สีม่วงเปลือกมังคุด
    ('GREEN', 'สีเขียว', 'Green'); -- Includes สีเขียวใบไม้, สีเขียวอ่อน, สีเขียวเข้ม, สีเขียวขี้ม้า
