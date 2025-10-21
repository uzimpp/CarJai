-- Create favourites table to store users' saved cars
-- Aligns with existing schema: users.id (PK) and cars.cid (PK)

CREATE TABLE IF NOT EXISTS favourites (
    fid SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    car_id INTEGER NOT NULL REFERENCES cars(cid) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, car_id)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_favourites_user_id ON favourites(user_id);
CREATE INDEX IF NOT EXISTS idx_favourites_car_id ON favourites(car_id);
CREATE INDEX IF NOT EXISTS idx_favourites_created_at ON favourites(created_at);