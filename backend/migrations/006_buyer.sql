-- Buyers
CREATE TABLE buyers (
    id INTEGER PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    province VARCHAR(100),
    budget_min INT,
    budget_max INT,
    -- status VARCHAR(20) NOT NULL DEFAULT 'active',
    CONSTRAINT chk_budget_nonneg CHECK (
        budget_min IS NULL
        OR budget_min >= 0
    ),
    CONSTRAINT chk_budget_bounds CHECK (
        budget_min IS NULL
        OR budget_max IS NULL
        OR budget_min <= budget_max
    ),
    CONSTRAINT buyers_status_check CHECK (status IN ('active', 'banned', 'suspended'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_buyers_province ON buyers (province);

CREATE INDEX IF NOT EXISTS idx_buyers_budget ON buyers (budget_min, budget_max);

CREATE INDEX IF NOT EXISTS idx_buyers_status ON buyers (status);

-- Comments
COMMENT ON COLUMN buyers.status IS 'Buyer account status: active, banned, or suspended';
