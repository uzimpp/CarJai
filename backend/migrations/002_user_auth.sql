-- User authentication schema

-- Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    username VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL, -- display name "John Doe"
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User sessions
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users (id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_sessions_token ON user_sessions (token);

CREATE INDEX idx_user_sessions_user_id ON user_sessions (user_id);

CREATE INDEX idx_user_sessions_expires_at ON user_sessions (expires_at);

--

-- Expired session cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_user_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Cleanup trigger (on insert)
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_user_sessions()
RETURNS TRIGGER AS $$
BEGIN
    -- Cleanup expired sessions when new session is created
    PERFORM cleanup_expired_user_sessions();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_expired_user_sessions_trigger
    AFTER INSERT ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_cleanup_expired_user_sessions();

-- Add comments for documentation
COMMENT ON
TABLE users IS 'Regular users table for application users';

COMMENT ON
TABLE user_sessions IS 'Active user sessions with JWT tokens';

COMMENT ON COLUMN users.email IS 'Unique user email for login';

COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password';

COMMENT ON COLUMN users.created_at IS 'User account creation timestamp';

COMMENT ON COLUMN user_sessions.token IS 'JWT token for session authentication';

COMMENT ON COLUMN user_sessions.ip_address IS 'IP address from which session was created';

COMMENT ON COLUMN user_sessions.user_agent IS 'User agent string from login request';

COMMENT ON COLUMN user_sessions.expires_at IS 'Session expiration timestamp';

-- Common sort/filter on users by creation time
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at);
