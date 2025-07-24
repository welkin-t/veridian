-- name: CreateJob :one
INSERT INTO jobs (
    owner_id,
    image_uri,
    env_vars,
    delay_tolerance_hours
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: GetJob :one
SELECT * FROM jobs 
WHERE id = $1 AND owner_id = $2;

-- name: GetJobsByOwner :many
SELECT * FROM jobs 
WHERE owner_id = $1
ORDER BY created_at DESC;

-- name: GetJobsByOwnerWithLimit :many
SELECT * FROM jobs 
WHERE owner_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: UpdateJob :one
UPDATE jobs 
SET 
    image_uri = $3,
    env_vars = $4,
    delay_tolerance_hours = $5,
    updated_at = now()
WHERE id = $1 AND owner_id = $2
RETURNING *;

-- name: DeleteJob :exec
DELETE FROM jobs 
WHERE id = $1 AND owner_id = $2;

-- name: GetJobCount :one
SELECT COUNT(*) FROM jobs 
WHERE owner_id = $1;

-- name: GetRecentJobs :many
SELECT * FROM jobs 
WHERE owner_id = $1 
    AND created_at >= $2
ORDER BY created_at DESC;
