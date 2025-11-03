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

CREATE INDEX idx_market_price_brand_model_year ON market_price (brand, model_trim, year_start, year_end);

ALTER TABLE market_price
ADD CONSTRAINT market_price_unique UNIQUE (brand, model_trim, year_start, year_end);

