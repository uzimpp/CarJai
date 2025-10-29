-- migrations/009_market_price.sql

-- สร้างตาราง market_price
CREATE TABLE market_price (
    id SERIAL PRIMARY KEY,
    brand VARCHAR(255) NOT NULL,
    model_trim VARCHAR(255) NOT NULL,
    year_start SMALLINT NOT NULL,
    year_end SMALLINT NOT NULL,
    price_min_thb BIGINT NOT NULL,
    price_max_thb BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- สร้าง index (แนะนำ) เพื่อเพิ่มความเร็วในการ query และสำหรับ ON CONFLICT
CREATE INDEX idx_market_price_brand_model_year ON market_price (brand, model_trim, year_start, year_end);

-- สร้าง UNIQUE constraint สำหรับ UPSERT (ใช้ columns เดียวกับ index)
ALTER TABLE market_price
ADD CONSTRAINT market_price_unique UNIQUE (brand, model_trim, year_start, year_end);

-- (Optional) เพิ่ม trigger เพื่ออัปเดต updated_at อัตโนมัติ (ถ้ายังไม่มี function นี้)
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--    NEW.updated_at = NOW();
--    RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- CREATE TRIGGER update_market_price_updated_at
-- BEFORE UPDATE ON market_price
-- FOR EACH ROW
-- EXECUTE FUNCTION update_updated_at_column();