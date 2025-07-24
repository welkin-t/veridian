-- +goose Up
-- Add additional columns to users table for better authentication support

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Index for active users
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users (is_active);

-- Comments for new columns
COMMENT ON COLUMN users.email_verified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN users.last_login IS 'Timestamp of the user''s last successful login';
COMMENT ON COLUMN users.is_active IS 'Whether the user account is active (not suspended/disabled)';

-- +goose Down
-- Remove the added columns
ALTER TABLE users DROP COLUMN IF EXISTS email_verified;
ALTER TABLE users DROP COLUMN IF EXISTS last_login;
ALTER TABLE users DROP COLUMN IF EXISTS is_active;
DROP INDEX IF EXISTS idx_users_is_active;
