mermaid```
---
config:
  theme: redux-dark-color
---
erDiagram
    direction TB

    users {
        int uid PK "primary key"
        varchar email UK "unique, not null"
        varchar password_hash "not null"
        varchar user_name ""
        varchar name "not null"
        timestamp created_at "default: now()"
        timestamp updated_at "default: now()"
    }

    user_sessions {
        serial id PK ""
        int user_id FK "ref: users.uid ON DELETE CASCADE"
        varchar token UK "unique not null"
        inet ip_address "not null"
        text user_agent ""
        timestamp expires_at "not null"
        timestamp created_at "default: now()"
    }

    buyers {
        bigint buyer_id PK "ref: users.uid, unique (1:1)"
        varchar province "จังหวัด"
        int budget_min "งบขั้นต่ำ"
        int budget_max "งบสูงสุด"
    }

    sellers {
        int id PK "ref: users.uid ON DELETE CASCADE"
        varchar display_name "ชื่อแสดง (max 50, not blank)"
        text about "เกี่ยวกับ (max 200)"
        text map_link "ลิงก์แผนที่"
    }

    seller_contacts {
        serial id PK ""
        int seller_id FK "ref: sellers.id ON DELETE CASCADE"
        varchar contact_type "phone/email/line/facebook/instagram/website"
        text value "phone, @handle, or URL"
        varchar label "optional label (max 80)"
    }

    body_types {
        int id PK ""
        varchar name UK "ประเภทตัวถัง"
    }
    transmissions {
        int id PK ""
        varchar name UK "เกียร์"
    }
    fuel_types {
        int id PK ""
        varchar name UK "ประเภทเชื้อเพลิง"
    }
    drivetrains {
        int id PK ""
        varchar name UK "ระบบขับเคลื่อน"
    }

	cars {
		int cid PK ""
		bigint seller_id FK "ref: sellers.id, not null"
		varchar brand_name "ยี่ห้อรถ"
		varchar model_name "รุ่นรถ"
		int year "ปี"
		int mileage "เลขไมล์"
		int price "ราคา (THB)"
		varchar province "จังหวัด"
		int condition_rating "คะแนนสภาพ 1-5"
		int body_type_id FK "ref: body_types.id"
		int transmission_id FK "ref: transmissions.id"
		int fuel_type_id FK "ref: fuel_types.id"
		int drivetrain_id FK "ref: drivetrains.id"
		int seats "จำนวนที่นั่ง"
		int doors "จำนวนประตู"
		varchar color "สี"
		enum status "draft/active/sold - default: 'draft'"
		boolean ocr_applied "default: false - ใช้ OCR แล้ว"
		timestamp created_at "default: now()"
		timestamp updated_at "default: now()"
	}

	car_images {
		int id PK ""
		int car_id FK "ref: cars.cid ON DELETE CASCADE"
		text url "รูปภาพ (URL)"
		boolean is_primary "default: false"
		int sort_order "default: 0"
		timestamp created_at "default: now()"
	}

	car_details {
		int car_id PK "ref: cars.cid, unique"
		varchar registration_number "เลขทะเบียน"
		date issue_date "วันที่ออกทะเบียน"
		varchar chassis_number "เลขตัวถัง"
		varchar engine_number "เลขเครื่องยนต์"
		varchar vehicle_type "ประเภทรถ"
		decimal weight "น้ำหนักรถ (กก.)"
		varchar owner_name "ชื่อเจ้าของ"
		varchar registration_office "สำนักงานขนส่ง"
		timestamp created_at "default: now()"
	}

	inspection_results {
		int irid PK ""
		int car_id FK "ref: cars.cid ON DELETE CASCADE"
		enum brake_result "ผลเบรค"
		enum handbrake_result "ผลเบรคมือ"
		enum alignment_result "ศูนย์ล้อ"
		enum noise_result "ระดับเสียง"
		enum emission_result "มลพิษ"
		enum horn_result "แตร"
		enum speedometer_result "มาตรวัดความเร็ว"
		enum high_low_beam_result "ไฟพุ่งไกล/ต่ำ"
		enum signal_lights_result "ไฟเลี้ยว/ป้าย/หยุด"
		enum other_lights_result "ไฟป้ายทะเบียน/อื่นๆ"
		enum difference_result "ความแตกต่าง"
		boolean overall_pass "ผ่านทั้งหมด"
		timestamp inspected_at "เวลาตรวจ"
		varchar station "ศูนย์ตรวจ"
	}


    brake_tests {
        int btid PK ""
        int inspection_id FK "ref: inspection_results.irid"
        decimal axle1_left "แรงห้ามล้อ เพลา 1 ซ้าย"
        decimal axle1_right "แรงห้ามล้อ เพลา 1 ขวา"
        decimal axle2_left "แรงห้ามล้อ เพลา 2 ซ้าย"
        decimal axle2_right "แรงห้ามล้อ เพลา 2 ขวา"
        decimal axle3_left "แรงห้ามล้อ เพลา 3 ซ้าย"
        decimal axle3_right "แรงห้ามล้อ เพลา 3 ขวา"
        decimal axle4_left "แรงห้ามล้อ เพลา 4 ซ้าย"
        decimal axle4_right "แรงห้ามล้อ เพลา 4 ขวา"
        decimal weight_axle1 "น้ำหนักลงเพลา 1"
        decimal weight_axle2 "น้ำหนักลงเพลา 2"
        decimal weight_axle3 "น้ำหนักลงเพลา 3"
        decimal weight_axle4 "น้ำหนักลงเพลา 4"
        decimal diff_axle1 "ผลต่าง เพลา 1 (%)"
        decimal diff_axle2 "ผลต่าง เพลา 2 (%)"
        decimal diff_axle3 "ผลต่าง เพลา 3 (%)"
        decimal diff_axle4 "ผลต่าง เพลา 4 (%)"
        decimal handbrake_left "แรงห้ามล้อมือ ซ้าย"
        decimal handbrake_right "แรงห้ามล้อมือ ขวา"
        decimal brake_efficiency "ประสิทธิภาพห้ามล้อ (%)"
        decimal handbrake_efficiency "ประสิทธิภาพห้ามล้อมือ (%)"
        decimal wheel_alignment "ศูนย์ล้อ"
    }

    light_tests {
        int ltid PK ""
        int inspection_id FK "ref: inspection_results.irid"
        decimal high_beam_left_intensity "ค่าโคมไฟพุ่งไกล ซ้าย"
        decimal high_beam_right_intensity "ค่าโคมไฟพุ่งไกล ขวา"
        decimal low_beam_left_intensity "ค่าโคมไฟพุ่งต่ำ ซ้าย"
        decimal low_beam_right_intensity "ค่าโคมไฟพุ่งต่ำ ขวา"
        decimal high_beam_left_position "ตำแหน่งโคมไฟพุ่งไกล ซ้าย"
        decimal high_beam_right_position "ตำแหน่งโคมไฟพุ่งไกล ขวา"
        decimal low_beam_left_position "ตำแหน่งโคมไฟพุ่งต่ำ ซ้าย"
        decimal low_beam_right_position "ตำแหน่งโคมไฟพุ่งต่ำ ขวา"
    }

    emission_tests {
        int etid PK ""
        int inspection_id FK "ref: inspection_results.irid"
        decimal noise_level "ค่าเครื่องวัดเสียง (dB)"
        decimal emission_co "ค่าไอเสีย CO (%)"
    }

    visual_inspections {
        int viid PK ""
        int inspection_id FK "ref: inspection_results.irid"
        enum windshield_result "ผ่าน/ไม่ผ่าน"
        enum steering_result "ระบบบังคับเลี้ยว"
        enum wheels_tires_result "ล้อและยาง"
        enum fuel_tank_result "ถังเชื้อเพลิง"
        enum chassis_result "เครื่องล่าง"
        enum body_result "ตัวถัง"
        enum doors_floor_result "ประตู/พื้น"
        enum seatbelt_result "เข็มขัดนิรภัย"
        enum wiper_result "ปัดน้ำฝน"
        enum horn_result "แตร"
        enum speedometer_result "มาตรวัดความเร็ว"
    }

    favourites {
        int fid PK ""
        int user_id FK "ref: users.uid"
        int car_id FK "ref: cars.cid"
    }

    recent_views {
        bigint rvid PK ""
        bigint user_id FK "ref: users.uid"
        int car_id FK "ref: cars.cid"
        timestamp viewed_at "default: now()"
    }

    market_prices {
        int mpid PK ""
        varchar brand_name "ยี่ห้อรถ"
        varchar model_name "รุ่นรถ"
        int year "ปี"
        decimal avg_price "ราคาเฉลี่ย"
        int sample_count "จำนวนตัวอย่าง (default: 1)"
        varchar province "จังหวัด"
        timestamp updated_at "default: now()"
    }

    admins {
        serial aid PK ""
        varchar username UK "unique not null"
        varchar password_hash "not null"
        varchar name "not null"
        timestamp last_login_at ""
        timestamp created_at "default: now()"
    }

    admin_sessions {
        serial asid PK ""
        int admin_id FK "ref: admins.aid"
        varchar token UK "unique not null"
        inet ip_address "not null"
        text user_agent ""
        timestamp expires_at "not null"
        timestamp created_at "default: now()"
    }

    admin_ip_whitelist {
        serial awid PK ""
        int admin_id FK "ref: admins.aid"
        inet ip_address "not null"
        varchar description ""
        timestamp created_at "default: now()"
    }

    %% Relationships
    users ||--o{ user_sessions : "has many sessions"
    users ||--o| buyers : "has buyer profile"
    users ||--o| sellers : "has seller profile"

    sellers ||--o{ seller_contacts : "has contact methods"
    sellers ||--o{ cars : "sells"
    
    cars ||--|| car_details : "has registration data"
    cars ||--o{ car_images : "has images"
    cars ||--o{ inspection_results : "has inspections"
    
    body_types ||--o{ cars : "categorizes"
    transmissions ||--o{ cars : "categorizes"
    fuel_types ||--o{ cars : "categorizes"
    drivetrains ||--o{ cars : "categorizes"

    inspection_results ||--|| brake_tests : "has brake test"
    inspection_results ||--|| light_tests : "has light test"
    inspection_results ||--|| emission_tests : "has emission test"
    inspection_results ||--|| visual_inspections : "has visual inspection"

    users ||--o{ favourites : "favorites"
    cars  ||--o{ favourites : "favorited by"

    users ||--o{ recent_views : "views"
    cars  ||--o{ recent_views : "viewed by"

    admins ||--o{ admin_sessions : "has many"
    admins ||--o{ admin_ip_whitelist : "has many"
```
