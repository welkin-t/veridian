-- +goose Up
-- Jobs table: stores job definitions and configurations
-- Each job belongs to a user and defines what needs to be executed

CREATE TABLE jobs (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_uri             TEXT NOT NULL,
    env_vars              JSONB NOT NULL DEFAULT '{}'::jsonb,
    delay_tolerance_hours INTEGER NOT NULL 
                          CHECK (delay_tolerance_hours >= 0 AND delay_tolerance_hours <= 168),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup of user's jobs (common operation)
CREATE INDEX idx_jobs_owner_id ON jobs (owner_id);

-- Comments for documentation
COMMENT ON TABLE jobs IS 'Job definitions and configurations';
COMMENT ON COLUMN jobs.id IS 'Unique job identifier';
COMMENT ON COLUMN jobs.owner_id IS 'Reference to the user who owns this job';
COMMENT ON COLUMN jobs.image_uri IS 'Container image URI to execute';
COMMENT ON COLUMN jobs.env_vars IS 'Environment variables as JSON object';
COMMENT ON COLUMN jobs.delay_tolerance_hours IS 'Maximum acceptable delay (0-168 hours = 1 week)';
COMMENT ON COLUMN jobs.created_at IS 'Job creation timestamp';
COMMENT ON COLUMN jobs.updated_at IS 'Last job update timestamp';

-- +goose Down
DROP TABLE IF EXISTS jobs;
