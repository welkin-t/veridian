-- +goose Up
-- User settings table: stores optimization preferences per user
-- One-to-one relationship with users table

CREATE TABLE user_settings (
    user_id       UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    cost_weight   NUMERIC(3, 2) NOT NULL DEFAULT 0.50 
                  CHECK (cost_weight BETWEEN 0.00 AND 1.00),
    carbon_weight NUMERIC(3, 2) NOT NULL DEFAULT 0.50 
                  CHECK (carbon_weight BETWEEN 0.00 AND 1.00),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Ensure weights always sum to 1.00
    CONSTRAINT weights_must_sum_to_one CHECK (cost_weight + carbon_weight = 1.00)
);

-- Comments for documentation
COMMENT ON TABLE user_settings IS 'User optimization preferences and weights';
COMMENT ON COLUMN user_settings.user_id IS 'Reference to users table (one-to-one)';
COMMENT ON COLUMN user_settings.cost_weight IS 'Weight for cost optimization (0.00-1.00)';
COMMENT ON COLUMN user_settings.carbon_weight IS 'Weight for carbon optimization (0.00-1.00)';
COMMENT ON COLUMN user_settings.updated_at IS 'Last settings update timestamp';
COMMENT ON CONSTRAINT weights_must_sum_to_one ON user_settings IS 'Ensures cost_weight + carbon_weight = 1.00';

-- +goose Down
DROP TABLE IF EXISTS user_settings;
