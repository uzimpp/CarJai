-- Inspection results table (Phase 1: Basic summary data)
-- This table stores the summary inspection results that are currently scraped from QR codes
CREATE TABLE inspection_results (
    irid SERIAL PRIMARY KEY,
    car_id INTEGER NOT NULL REFERENCES cars(cid) ON DELETE CASCADE,

-- Overall inspection status
overall_pass BOOLEAN, inspected_at TIMESTAMP, station VARCHAR(200),

-- Basic test results (summary level - what frontend currently sends)
brake_result VARCHAR(50), -- ผลเบรค (ผ่าน/ไม่ผ่าน)
handbrake_result VARCHAR(50), -- ผลเบรคมือ (ผ่าน/ไม่ผ่าน)
alignment_result VARCHAR(50), -- ศูนย์ล้อ (ผ่าน/ไม่ผ่าน)
noise_result VARCHAR(50), -- ระดับเสียง (ผ่าน/ไม่ผ่าน)
emission_result VARCHAR(50), -- มลพิษ (ผ่าน/ไม่ผ่าน)
horn_result VARCHAR(50), -- แตร (ผ่าน/ไม่ผ่าน)
speedometer_result VARCHAR(50), -- มาตรวัดความเร็ว (ผ่าน/ไม่ผ่าน)
high_low_beam_result VARCHAR(50), -- ไฟพุ่งไกล/ต่ำ (ผ่าน/ไม่ผ่าน)
signal_lights_result VARCHAR(50), -- ไฟเลี้ยว/ป้าย/หยุด (ผ่าน/ไม่ผ่าน)
other_lights_result VARCHAR(50), -- ไฟป้ายทะเบียน/อื่นๆ (ผ่าน/ไม่ผ่าน)
difference_result VARCHAR(50), -- ความแตกต่าง (ผ่าน/ไม่ผ่าน)

-- Performance metrics (as text from scraper)
brake_performance VARCHAR(50), -- ประสิทธิภาพห้ามล้อ (%)
handbrake_performance VARCHAR(50), -- ประสิทธิภาพห้ามล้อมือ (%)
emission_co VARCHAR(50), -- ค่าไอเสีย CO (% CO/HC)
noise_level VARCHAR(50), -- ค่าเครื่องวัดเสียง (dBA)
wheel_alignment VARCHAR(50), -- ศูนย์ล้อ

-- Chassis/body condition (from scraper)


chassis_condition VARCHAR(50),         -- สภาพตัวถังและโครงรถ
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_inspection_results_car_id ON inspection_results (car_id);

CREATE INDEX idx_inspection_results_inspected_at ON inspection_results (inspected_at);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_inspection_results_updated_at BEFORE UPDATE ON inspection_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================================
-- PHASE 2: Detailed test tables (commented out for future implementation)
-- ================================================================================
-- These tables will be created in Phase 2 when the scraper is enhanced to extract
-- detailed per-axle brake data, light measurements, and visual inspection details.
--
-- Uncomment and implement when scraper extracts detailed data:
--
-- CREATE TABLE brake_tests (
--     btid SERIAL PRIMARY KEY,
--     inspection_id INTEGER NOT NULL REFERENCES inspection_results(irid) ON DELETE CASCADE,
--     axle1_left DECIMAL(10, 2),
--     axle1_right DECIMAL(10, 2),
--     ... (20+ fields for detailed brake measurements)
-- );
--
-- CREATE TABLE light_tests (
--     ltid SERIAL PRIMARY KEY,
--     inspection_id INTEGER NOT NULL REFERENCES inspection_results(irid) ON DELETE CASCADE,
--     high_beam_left_intensity DECIMAL(10, 2),
--     ... (8 fields for light measurements)
-- );
--
-- CREATE TABLE emission_tests (
--     etid SERIAL PRIMARY KEY,
--     inspection_id INTEGER NOT NULL REFERENCES inspection_results(irid) ON DELETE CASCADE,
--     noise_level DECIMAL(10, 2),
--     emission_co DECIMAL(10, 2)
-- );
--
-- CREATE TABLE visual_inspections (
--     viid SERIAL PRIMARY KEY,
--     inspection_id INTEGER NOT NULL REFERENCES inspection_results(irid) ON DELETE CASCADE,
--     windshield_result VARCHAR(20),
--     steering_result VARCHAR(20),
--     ... (11 fields for visual checks)
-- );
-- ================================================================================
