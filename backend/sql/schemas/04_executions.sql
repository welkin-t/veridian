-- +goose Up
-- Execution status enum: defines possible states of job executions
CREATE TYPE execution_status AS ENUM (
    'pending',           -- Waiting to be scheduled
    'evaluating',        -- Scheduler is finding optimal resources
    'running',           -- Currently executing on VM
    'completed_success', -- Finished successfully
    'completed_error',   -- Finished with error
    'orphaned'           -- VM created but couldn't be destroyed (needs manual intervention)
);

-- Executions table: tracks each execution attempt of a job
-- This is the most complex table, storing detailed execution history and metrics

CREATE TABLE executions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id                  UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    status                  execution_status NOT NULL DEFAULT 'pending',

    -- Scheduling details
    chosen_at               TIMESTAMPTZ, -- When scheduler selected this execution for processing
    cloud_region            TEXT,

    -- Execution details
    vm_type                 TEXT,
    started_at              TIMESTAMPTZ, -- When VM started and container began execution
    completed_at            TIMESTAMPTZ, -- When container finished execution
    exit_code               INTEGER,
    log_uri                 TEXT, -- S3/Azure blob storage URI for execution logs

    -- Cost and carbon metrics
    cost_estimate_usd       NUMERIC(10, 6), -- Estimated cost before execution
    cost_actual_usd         NUMERIC(10, 6), -- Actual cost after execution
    carbon_intensity_g_kwh  NUMERIC(10, 4), -- Carbon intensity of region at execution time (g CO2/kWh)
    carbon_emitted_kg       NUMERIC(10, 6), -- Total carbon emissions from execution (kg CO2)

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_executions_job_id ON executions (job_id);

-- Partial index for pending executions (scheduler's most frequent query)
-- Only indexes rows where status = 'pending' for maximum efficiency
CREATE INDEX idx_executions_pending ON executions (status) WHERE status = 'pending';

-- Comments for documentation
COMMENT ON TYPE execution_status IS 'Possible states of job executions';
COMMENT ON TABLE executions IS 'Execution history and metrics for job runs';
COMMENT ON COLUMN executions.id IS 'Unique execution identifier';
COMMENT ON COLUMN executions.job_id IS 'Reference to the job being executed';
COMMENT ON COLUMN executions.status IS 'Current execution status';
COMMENT ON COLUMN executions.chosen_at IS 'When scheduler selected this execution';
COMMENT ON COLUMN executions.cloud_region IS 'Cloud region where execution ran';
COMMENT ON COLUMN executions.vm_type IS 'Type of VM used for execution';
COMMENT ON COLUMN executions.started_at IS 'When container started executing';
COMMENT ON COLUMN executions.completed_at IS 'When container finished executing';
COMMENT ON COLUMN executions.exit_code IS 'Container exit code (0 = success)';
COMMENT ON COLUMN executions.log_uri IS 'URI to execution logs in object storage';
COMMENT ON COLUMN executions.cost_estimate_usd IS 'Estimated cost before execution';
COMMENT ON COLUMN executions.cost_actual_usd IS 'Actual cost after execution';
COMMENT ON COLUMN executions.carbon_intensity_g_kwh IS 'Carbon intensity at execution time (g CO2/kWh)';
COMMENT ON COLUMN executions.carbon_emitted_kg IS 'Total carbon emissions (kg CO2)';

-- +goose Down
DROP TABLE IF EXISTS executions;
DROP TYPE IF EXISTS execution_status;
