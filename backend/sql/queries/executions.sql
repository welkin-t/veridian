-- name: CreateExecution :one
INSERT INTO executions (
    job_id,
    status
) VALUES (
    $1, $2
) RETURNING *;

-- name: GetExecution :one
SELECT * FROM executions 
WHERE id = $1;

-- name: GetExecutionsByJobID :many
SELECT * FROM executions 
WHERE job_id = $1
ORDER BY created_at DESC;

-- name: GetExecutionsByJobIDWithLimit :many
SELECT * FROM executions 
WHERE job_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetPendingExecutions :many
SELECT * FROM executions 
WHERE status = 'pending'
ORDER BY created_at ASC;

-- name: GetExecutionsByStatus :many
SELECT * FROM executions 
WHERE status = $1
ORDER BY created_at DESC;

-- name: UpdateExecutionStatus :one
UPDATE executions 
SET status = $2
WHERE id = $1
RETURNING *;

-- name: UpdateExecutionScheduling :one
UPDATE executions 
SET 
    status = $2,
    chosen_at = $3,
    cloud_region = $4,
    vm_type = $5
WHERE id = $1
RETURNING *;

-- name: UpdateExecutionStart :one
UPDATE executions 
SET 
    status = 'running',
    started_at = $2
WHERE id = $1
RETURNING *;

-- name: UpdateExecutionComplete :one
UPDATE executions 
SET 
    status = $2,
    completed_at = $3,
    exit_code = $4,
    log_uri = $5,
    cost_actual_usd = $6,
    carbon_emitted_kg = $7
WHERE id = $1
RETURNING *;

-- name: UpdateExecutionCostEstimate :one
UPDATE executions 
SET 
    cost_estimate_usd = $2,
    carbon_intensity_g_kwh = $3
WHERE id = $1
RETURNING *;

-- name: GetExecutionStats :one
SELECT 
    COUNT(*) as total_executions,
    COUNT(*) FILTER (WHERE status = 'completed_success') as successful_executions,
    COUNT(*) FILTER (WHERE status = 'completed_error') as failed_executions,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_executions,
    COUNT(*) FILTER (WHERE status = 'running') as running_executions,
    AVG(cost_actual_usd) as avg_cost,
    SUM(carbon_emitted_kg) as total_carbon
FROM executions 
WHERE job_id = $1;

-- name: GetUserExecutionStats :one
SELECT 
    COUNT(*) as total_executions,
    COUNT(*) FILTER (WHERE status = 'completed_success') as successful_executions,
    COUNT(*) FILTER (WHERE status = 'completed_error') as failed_executions,
    AVG(cost_actual_usd) as avg_cost,
    SUM(cost_actual_usd) as total_cost,
    SUM(carbon_emitted_kg) as total_carbon
FROM executions e
JOIN jobs j ON e.job_id = j.id
WHERE j.owner_id = $1;

-- name: DeleteExecution :exec
DELETE FROM executions 
WHERE id = $1;
