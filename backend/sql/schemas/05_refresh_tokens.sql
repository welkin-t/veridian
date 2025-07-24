-- +goose Up
-- Refresh tokens table: stores refresh tokens for JWT authentication
-- Each user can have multiple refresh tokens (different devices/sessions)

CREATE TABLE refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used  TIMESTAMPTZ,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    user_agent TEXT,
    ip_address INET
);

-- Indexes for performance
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);

-- Index for cleanup of expired tokens
CREATE INDEX idx_refresh_tokens_expired ON refresh_tokens (expires_at) WHERE is_revoked = FALSE;

-- Comments for documentation
COMMENT ON TABLE refresh_tokens IS 'Stores refresh tokens for JWT authentication';
COMMENT ON COLUMN refresh_tokens.id IS 'Unique refresh token identifier';
COMMENT ON COLUMN refresh_tokens.user_id IS 'Reference to users table';
COMMENT ON COLUMN refresh_tokens.token_hash IS 'SHA-256 hash of the refresh token';
COMMENT ON COLUMN refresh_tokens.expires_at IS 'When this refresh token expires';
COMMENT ON COLUMN refresh_tokens.created_at IS 'When this refresh token was created';
COMMENT ON COLUMN refresh_tokens.last_used IS 'When this refresh token was last used';
COMMENT ON COLUMN refresh_tokens.is_revoked IS 'Whether this refresh token has been revoked';
COMMENT ON COLUMN refresh_tokens.user_agent IS 'User agent of the client that created this token';
COMMENT ON COLUMN refresh_tokens.ip_address IS 'IP address of the client that created this token';

-- +goose Down
DROP TABLE IF EXISTS refresh_tokens;
