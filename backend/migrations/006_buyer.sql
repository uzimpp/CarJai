-- Buyers
CREATE TABLE buyers (
    id INTEGER PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    province VARCHAR(100),
    budget_min INT,
    budget_max INT,
    CONSTRAINT chk_budget_nonneg CHECK (
        budget_min IS NULL
        OR budget_min >= 0
    ),
    CONSTRAINT chk_budget_bounds CHECK (
        budget_min IS NULL
        OR budget_max IS NULL
        OR budget_min <= budget_max
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_buyers_province ON buyers (province);

CREATE INDEX IF NOT EXISTS idx_buyers_budget ON buyers (budget_min, budget_max);
