-- Body types
CREATE TABLE body_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE, -- e.g., PICKUP, SUV, CITYCAR, etc.
    name_th VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL
);

-- Transmissions
CREATE TABLE transmissions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE, -- MANUAL, AT
    name_th VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL
);

-- Fuels
CREATE TABLE fuel_types (
    code VARCHAR(20) PRIMARY KEY,
    label_th VARCHAR(100) NOT NULL,
    label_en VARCHAR(100) NOT NULL
);

-- Drivetrains
CREATE TABLE drivetrains (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE, -- FWD, RWD, AWD, 4WD
    name_th VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL
);

-- Colors
CREATE TABLE colors (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE, -- RED, GRAY, BLUE, etc.
    label_th VARCHAR(100) NOT NULL,
    label_en VARCHAR(100) NOT NULL
);

CREATE TABLE provinces (
    id SERIAL PRIMARY KEY,
    name_th VARCHAR(50) NOT NULL,
    name_en VARCHAR(50) NOT NULL,
    region_th VARCHAR(30),
    region_en VARCHAR(30)
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

INSERT INTO
    drivetrains (code, name_th, name_en)
VALUES ('FWD', 'ขับหน้า', 'FWD'),
    ('RWD', 'ขับหลัง', 'RWD'),
    (
        'AWD',
        'ขับทุกล้อ (AWD)',
        'AWD'
    ),
    (
        '4WD',
        'ขับสี่ล้อ (4WD)',
        '4WD'
    );

INSERT INTO
    colors (code, label_th, label_en)
VALUES ('RED', 'แดง', 'Red'), -- Includes สีแดงเลือดหมู, สีแดงเลือดนก, สีแดงบานเย็น, สีแดงทับทิม
    ('GRAY', 'เทา', 'Gray'), -- Includes สีเทาอ่อน, สีเทาออกดำ, สีบรอนซ์เงิน, สีตะกั่วตัด
    ('BLUE', 'น้ำเงิน', 'Blue'), -- Includes สีน้ำเงินเข้ม, สีคราม, สีกรมท่า
    (
        'LIGHT_BLUE',
        'ฟ้า',
        'Light Blue'
    ), -- Includes สีฟ้าอ่อน, สีฟ้าเข้ม
    ('YELLOW', 'เหลือง', 'Yellow'), -- Includes สีเหลืองอ่อน, สีเหลืองทอง, สีครีมออกเหลือง
    ('PINK', 'ชมพู', 'Pink'), -- Includes สีชมพูอ่อน, สีชมพูเข้ม
    ('WHITE', 'ขาว', 'White'), -- Includes สีขาวงาช้าง, สีครีมออกขาว
    ('BROWN', 'น้ำตาล', 'Brown'), -- Includes สีน้ำตาลอ่อน, สีน้ำตาลไหม้, สีน้ำตาลเข้ม, สีแชล็ค
    ('BLACK', 'ดำ', 'Black'), -- Includes สีดำออกเทา
    ('ORANGE', 'ส้ม', 'Orange'), -- Includes สีแสด, สีอิฐ, สีปูนแห้ง
    ('PURPLE', 'ม่วง', 'Purple'), -- Includes สีม่วงอ่อน, สีม่วงเข้ม, สีม่วงเปลือกมังคุด
    ('GREEN', 'เขียว', 'Green'), -- Includes สีเขียวใบไม้, สีเขียวอ่อน, สีเขียวเข้ม, สีเขียวขี้ม้า
    (
        'MULTICOLOR',
        'หลากสี',
        'Multicolor'
    );
-- For cars with >3 colors or indeterminate main color

INSERT INTO
    provinces (
        name_th,
        name_en,
        region_th,
        region_en
    )
VALUES (
        'เชียงใหม่',
        'Chiang Mai',
        'ภาคเหนือ',
        'North'
    ),
    (
        'เชียงราย',
        'Chiang Rai',
        'ภาคเหนือ',
        'North'
    ),
    (
        'ลำพูน',
        'Lamphun',
        'ภาคเหนือ',
        'North'
    ),
    (
        'ลำปาง',
        'Lampang',
        'ภาคเหนือ',
        'North'
    ),
    (
        'แม่ฮ่องสอน',
        'Mae Hong Son',
        'ภาคเหนือ',
        'North'
    ),
    (
        'น่าน',
        'Nan',
        'ภาคเหนือ',
        'North'
    ),
    (
        'พะเยา',
        'Phayao',
        'ภาคเหนือ',
        'North'
    ),
    (
        'แพร่',
        'Phrae',
        'ภาคเหนือ',
        'North'
    ),
    (
        'อุตรดิตถ์',
        'Uttaradit',
        'ภาคเหนือ',
        'North'
    ),
    (
        'พิษณุโลก',
        'Phitsanulok',
        'ภาคเหนือ',
        'North'
    ),
    (
        'สุโขทัย',
        'Sukhothai',
        'ภาคเหนือ',
        'North'
    ),
    (
        'พิจิตร',
        'Phichit',
        'ภาคเหนือ',
        'North'
    ),
    (
        'กำแพงเพชร',
        'Kamphaeng Phet',
        'ภาคเหนือ',
        'North'
    ),
    (
        'ตาก',
        'Tak',
        'ภาคเหนือ',
        'North'
    ),
    (
        'ขอนแก่น',
        'Khon Kaen',
        'ภาคตะวันออกเฉียงเหนือ',
        'Northeast'
    ),
    (
        'กาฬสินธุ์',
        'Kalasin',
        'ภาคตะวันออกเฉียงเหนือ',
        'Northeast'
    ),
    (
        'มหาสารคาม',
        'Maha Sarakham',
        'ภาคตะวันออกเฉียงเหนือ',
        'Northeast'
    ),
    (
        'ร้อยเอ็ด',
        'Roi Et',
        'ภาคตะวันออกเฉียงเหนือ',
        'Northeast'
    ),
    (
        'ยโสธร',
        'Yasothon',
        'ภาคตะวันออกเฉียงเหนือ',
        'Northeast'
    ),
    (
        'อำนาจเจริญ',
        'Amnat Charoen',
        'ภาคตะวันออกเฉียงเหนือ',
        'Northeast'
    ),
    (
        'อุบลราชธานี',
        'Ubon Ratchathani',
        'ภาคตะวันออกเฉียงเหนือ',
        'Northeast'
    ),
    (
        'ศรีสะเกษ',
        'Si Sa Ket',
        'ภาคตะวันออกเฉียงเหนือ',
        'Northeast'
    ),
    (
        'นครราชสีมา',
        'Nakhon Ratchasima',
        'ภาคตะวันออกเฉียงเหนือ',
        'Northeast'
    ),
    (
        'บุรีรัมย์',
        'Buri Ram',
        'ภาคตะวันออกเฉียงเหนือ',
        'Northeast'
    ),
    (
        'สุรินทร์',
        'Surin',
        'ภาคตะวันออกเฉียงเหนือ',
        'Northeast'
    ),
    (
        'ชัยภูมิ',
        'Chaiyaphum',
        'ภาคตะวันออกเฉียงเหนือ',
        'Northeast'
    ),
    (
        'หนองบัวลำภู',
        'Nong Bua Lam Phu',
        'ภาคตะวันออกเฉียงเหนือ',
        'Northeast'
    ),
    (
        'หนองคาย',
        'Nong Khai',
        'ภาคตะวันออกเฉียงเหนือ',
        'Northeast'
    ),
    (
        'เลย',
        'Loei',
        'ภาคตะวันออกเฉียงเหนือ',
        'Northeast'
    ),
    (
        'สกลนคร',
        'Sakon Nakhon',
        'ภาคตะวันออกเฉียงเหนือ',
        'Northeast'
    ),
    (
        'นครพนม',
        'Nakhon Phanom',
        'ภาคตะวันออกเฉียงเหนือ',
        'Northeast'
    ),
    (
        'มุกดาหาร',
        'Mukdahan',
        'ภาคตะวันออกเฉียงเหนือ',
        'Northeast'
    ),
    (
        'กรุงเทพมหานคร',
        'Bangkok',
        'ภาคกลาง',
        'Central'
    ),
    (
        'นนทบุรี',
        'Nonthaburi',
        'ภาคกลาง',
        'Central'
    ),
    (
        'ปทุมธานี',
        'Pathum Thani',
        'ภาคกลาง',
        'Central'
    ),
    (
        'พระนครศรีอยุธยา',
        'Phra Nakhon Si Ayutthaya',
        'ภาคกลาง',
        'Central'
    ),
    (
        'สระบุรี',
        'Saraburi',
        'ภาคกลาง',
        'Central'
    ),
    (
        'ลพบุรี',
        'Lop Buri',
        'ภาคกลาง',
        'Central'
    ),
    (
        'อ่างทอง',
        'Ang Thong',
        'ภาคกลาง',
        'Central'
    ),
    (
        'สิงห์บุรี',
        'Sing Buri',
        'ภาคกลาง',
        'Central'
    ),
    (
        'ชัยนาท',
        'Chai Nat',
        'ภาคกลาง',
        'Central'
    ),
    (
        'สุพรรณบุรี',
        'Suphan Buri',
        'ภาคกลาง',
        'Central'
    ),
    (
        'นครปฐม',
        'Nakhon Pathom',
        'ภาคกลาง',
        'Central'
    ),
    (
        'สมุทรสาคร',
        'Samut Sakhon',
        'ภาคกลาง',
        'Central'
    ),
    (
        'สมุทรปราการ',
        'Samut Prakan',
        'ภาคกลาง',
        'Central'
    ),
    (
        'สมุทรสงคราม',
        'Samut Songkhram',
        'ภาคกลาง',
        'Central'
    ),
    (
        'ราชบุรี',
        'Ratchaburi',
        'ภาคกลาง',
        'Central'
    ),
    (
        'นครนายก',
        'Nakhon Nayok',
        'ภาคกลาง',
        'Central'
    ),
    (
        'กาญจนบุรี',
        'Kanchanaburi',
        'ภาคตะวันตก',
        'West'
    ),
    (
        'เพชรบุรี',
        'Phetchaburi',
        'ภาคตะวันตก',
        'West'
    ),
    (
        'ชลบุรี',
        'Chon Buri',
        'ภาคตะวันออก',
        'East'
    ),
    (
        'ระยอง',
        'Rayong',
        'ภาคตะวันออก',
        'East'
    ),
    (
        'จันทบุรี',
        'Chanthaburi',
        'ภาคตะวันออก',
        'East'
    ),
    (
        'ตราด',
        'Trat',
        'ภาคตะวันออก',
        'East'
    ),
    (
        'ปราจีนบุรี',
        'Prachin Buri',
        'ภาคตะวันออก',
        'East'
    ),
    (
        'สระแก้ว',
        'Sa Kaeo',
        'ภาคตะวันออก',
        'East'
    ),
    (
        'นครนายก',
        'Nakhon Nayok',
        'ภาคตะวันออก',
        'East'
    ), -- overlaps regionally sometimes
    (
        'ประจวบคีรีขันธ์',
        'Prachuap Khiri Khan',
        'ภาคใต้',
        'South'
    ),
    (
        'ชุมพร',
        'Chumphon',
        'ภาคใต้',
        'South'
    ),
    (
        'ระนอง',
        'Ranong',
        'ภาคใต้',
        'South'
    ),
    (
        'สุราษฎร์ธานี',
        'Surat Thani',
        'ภาคใต้',
        'South'
    ),
    (
        'นครศรีธรรมราช',
        'Nakhon Si Thammarat',
        'ภาคใต้',
        'South'
    ),
    (
        'พัทลุง',
        'Phatthalung',
        'ภาคใต้',
        'South'
    ),
    (
        'สงขลา',
        'Songkhla',
        'ภาคใต้',
        'South'
    ),
    (
        'สตูล',
        'Satun',
        'ภาคใต้',
        'South'
    ),
    (
        'ตรัง',
        'Trang',
        'ภาคใต้',
        'South'
    ),
    (
        'กระบี่',
        'Krabi',
        'ภาคใต้',
        'South'
    ),
    (
        'พังงา',
        'Phangnga',
        'ภาคใต้',
        'South'
    ),
    (
        'ภูเก็ต',
        'Phuket',
        'ภาคใต้',
        'South'
    ),
    (
        'ยะลา',
        'Yala',
        'ภาคใต้',
        'South'
    ),
    (
        'ปัตตานี',
        'Pattani',
        'ภาคใต้',
        'South'
    ),
    (
        'นราธิวาส',
        'Narathiwat',
        'ภาคใต้',
        'South'
    );
