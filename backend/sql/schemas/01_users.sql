-- +goose Up
-- Users table: stores basic user information with secure password handling
-- Critical: passwords are stored as hashed values, never plaintext

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE 
                    CHECK (email ~* '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'),
    hashed_password TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast email lookups (unique constraint already creates one, but explicit is better)
CREATE INDEX idx_users_email ON users (email);

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores basic user account information';
COMMENT ON COLUMN users.id IS 'Unique user identifier using UUID';
COMMENT ON COLUMN users.email IS 'User email with format validation';
COMMENT ON COLUMN users.hashed_password IS 'Securely hashed password (bcrypt/argon2)';
COMMENT ON COLUMN users.created_at IS 'Account creation timestamp';
COMMENT ON COLUMN users.updated_at IS 'Last account update timestamp';

-- +goose Down
DROP TABLE IF EXISTS users;
