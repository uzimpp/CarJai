-- Create favourites table to store users' saved cars
-- Aligns with existing schema: users.id (PK) and cars.id (PK)

CREATE TABLE favourites (
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    car_id INTEGER NOT NULL REFERENCES cars (id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, car_id)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_favourites_user_id ON favourites(user_id);
CREATE INDEX IF NOT EXISTS idx_favourites_car_id ON favourites(car_id);
CREATE INDEX IF NOT EXISTS idx_favourites_created_at ON favourites(created_at);
