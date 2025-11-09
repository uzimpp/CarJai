-- Google OAuth fields for users

-- Add columns to users table to support social authentication
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE,
    ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50),
    ADD COLUMN IF NOT EXISTS provider_linked_at TIMESTAMP;

-- Index for faster lookup by google_id
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users (google_id);

-- Documentation comments
COMMENT ON COLUMN users.google_id IS 'Google account ID linked to this user';
COMMENT ON COLUMN users.auth_provider IS 'Authentication provider (e.g., google)';
COMMENT ON COLUMN users.provider_linked_at IS 'Timestamp when provider was linked';