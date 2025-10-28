-- Admin authentication schema

-- Admins
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Admin sessions
CREATE TABLE admin_sessions (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES admins (id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Admin IP whitelist
CREATE TABLE admin_ip_whitelist (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES admins (id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_admin_sessions_token ON admin_sessions (token);

CREATE INDEX idx_admin_sessions_admin_id ON admin_sessions (admin_id);

CREATE INDEX idx_admin_sessions_expires_at ON admin_sessions (expires_at);

CREATE INDEX idx_admin_ip_whitelist_admin_id ON admin_ip_whitelist (admin_id);

CREATE INDEX idx_admin_ip_whitelist_ip ON admin_ip_whitelist (ip_address);

-- Expired session cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM admin_sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Cleanup trigger (on insert)
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_sessions()
RETURNS TRIGGER AS $$
BEGIN
    -- Cleanup expired sessions when new session is created
    PERFORM cleanup_expired_admin_sessions();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_expired_sessions_trigger
    AFTER INSERT ON admin_sessions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_cleanup_expired_sessions();

-- Add comments for documentation
COMMENT ON
TABLE admins IS 'Admin users table for system administration';

COMMENT ON
TABLE admin_sessions IS 'Active admin sessions with JWT tokens';

COMMENT ON
TABLE admin_ip_whitelist IS 'IP address whitelist for admin access';

COMMENT ON COLUMN admins.username IS 'Unique admin username for login';

COMMENT ON COLUMN admins.password_hash IS 'Bcrypt hashed password';

COMMENT ON COLUMN admins.name IS 'Display name of the admin';

COMMENT ON COLUMN admins.last_login_at IS 'Timestamp of last successful login';

COMMENT ON COLUMN admin_sessions.token IS 'JWT token for session authentication';

COMMENT ON COLUMN admin_sessions.ip_address IS 'IP address from which session was created';

COMMENT ON COLUMN admin_sessions.user_agent IS 'User agent string from login request';

COMMENT ON COLUMN admin_sessions.expires_at IS 'Session expiration timestamp';
