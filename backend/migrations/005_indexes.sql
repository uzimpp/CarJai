-- Indexing migration for CarJai
-- Purpose: Speed up common lookups (public seller search, admin sorting)

-- Optional extension for fuzzy search (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Sellers: case-insensitive name search for public seller searches
CREATE INDEX IF NOT EXISTS idx_sellers_display_name_ci ON sellers (lower(display_name));

-- Buyers: enable if you frequently filter by province
CREATE INDEX IF NOT EXISTS idx_buyers_province ON buyers (province);

-- Buyers: enable if you query by budget ranges often
CREATE INDEX IF NOT EXISTS idx_buyers_budget ON buyers (budget_min, budget_max);

-- Users: enable if you commonly sort/filter lists by creation time
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at);

-- Seller contacts: index on seller_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_seller_contacts_seller_id ON seller_contacts (seller_id);

COMMENT ON INDEX idx_sellers_display_name_ci IS 'Case-insensitive search on seller display names';

COMMENT ON INDEX idx_buyers_province IS 'Filter buyers by province';

COMMENT ON INDEX idx_buyers_budget IS 'Query buyers by budget range';

COMMENT ON INDEX idx_users_created_at IS 'Sort/filter users by creation time';

COMMENT ON INDEX idx_seller_contacts_seller_id IS 'Lookup seller contacts by seller_id';
