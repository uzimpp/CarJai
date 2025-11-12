-- Reports and Moderation

-- Up
-- Reports table supports car and seller reports
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    report_type VARCHAR(10) NOT NULL CHECK (report_type IN ('car','seller')),
    car_id INTEGER REFERENCES cars (id) ON DELETE CASCADE,
    seller_id INTEGER REFERENCES sellers (id) ON DELETE CASCADE,
    reporter_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    topic VARCHAR(50) NOT NULL,
    sub_topics JSONB DEFAULT '[]'::jsonb,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending','reviewed','resolved','dismissed')
    ),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMP,
    reviewed_by_admin_id INTEGER REFERENCES admins (id) ON DELETE SET NULL,
    admin_notes TEXT,
    CONSTRAINT reports_target_presence CHECK (
        (report_type = 'car' AND car_id IS NOT NULL AND seller_id IS NULL)
        OR
        (report_type = 'seller' AND seller_id IS NOT NULL AND car_id IS NULL)
    )
);

-- Indexes for common filters
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports (reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_car_id ON reports (car_id);
CREATE INDEX IF NOT EXISTS idx_reports_seller_id ON reports (seller_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at_desc ON reports (created_at DESC);

-- Admin actions on sellers (audit log)
CREATE TABLE IF NOT EXISTS seller_admin_actions (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES sellers (id) ON DELETE CASCADE,
    admin_id INTEGER NOT NULL REFERENCES admins (id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('ban','suspend','warn')),
    notes TEXT,
    suspend_until TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seller_admin_actions_seller_id ON seller_admin_actions (seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_admin_actions_created_at ON seller_admin_actions (created_at);