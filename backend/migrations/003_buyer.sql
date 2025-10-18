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

CREATE TABLE favourites (
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    car_id INTEGER NOT NULL REFERENCES cars (cid) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, car_id)
);

CREATE TABLE recent_views (
    user_id INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    car_id INT NOT NULL REFERENCES cars (cid) ON DELETE CASCADE,
    last_viewed_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, car_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_buyers_province ON buyers (province);

CREATE INDEX IF NOT EXISTS idx_buyers_budget ON buyers (budget_min, budget_max);
