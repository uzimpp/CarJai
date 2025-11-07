-- Recent Views Schema for CarJai
-- This file contains the database schema for tracking user car viewing history

-- Create recent_views table
CREATE TABLE recent_views (
    rvid SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- CREATE TABLE recent_views (
--     user_id INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
--     car_id INT NOT NULL REFERENCES cars (id) ON DELETE CASCADE,
--     last_viewed_at timestamptz NOT NULL DEFAULT now(),
--     PRIMARY KEY (user_id, car_id)
-- );

-- Create indexes for performance optimization
CREATE INDEX idx_recent_views_user_id ON recent_views (user_id);
CREATE INDEX idx_recent_views_car_id ON recent_views (car_id);
CREATE INDEX idx_recent_views_viewed_at ON recent_views (viewed_at DESC);

-- Create composite index for efficient queries
CREATE INDEX idx_recent_views_user_viewed ON recent_views (user_id, viewed_at DESC);

-- Create unique constraint to prevent duplicate views within the same minute
-- This helps prevent spam while allowing legitimate re-views
CREATE UNIQUE INDEX idx_recent_views_unique ON recent_views (user_id, car_id, DATE_TRUNC('minute', viewed_at));

-- Function to clean up old viewing history (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_recent_views()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM recent_views 
    WHERE viewed_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add comment to the table
COMMENT ON TABLE recent_views IS 'Tracks user viewing history for cars';
COMMENT ON COLUMN recent_views.rvid IS 'Primary key for recent views';
COMMENT ON COLUMN recent_views.user_id IS 'Foreign key to users table';
COMMENT ON COLUMN recent_views.car_id IS 'Foreign key to cars table';
COMMENT ON COLUMN recent_views.viewed_at IS 'Timestamp when the car was viewed';