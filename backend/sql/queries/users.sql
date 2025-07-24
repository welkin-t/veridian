-- name: CreateUser :one
INSERT INTO users (
    email,
    hashed_password,
    email_verified,
    is_active
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: GetUserByID :one
SELECT * FROM users 
WHERE id = $1 AND is_active = TRUE;

-- name: GetUserByEmail :one
SELECT * FROM users 
WHERE email = $1 AND is_active = TRUE;

-- name: GetUserByEmailIncludeInactive :one
SELECT * FROM users 
WHERE email = $1;

-- name: UpdateUserPassword :one
UPDATE users 
SET 
    hashed_password = $2,
    updated_at = now()
WHERE id = $1 AND is_active = TRUE
RETURNING *;

-- name: UpdateUserLastLogin :exec
UPDATE users 
SET 
    last_login = now(),
    updated_at = now()
WHERE id = $1;

-- name: UpdateUserEmailVerified :exec
UPDATE users 
SET 
    email_verified = $2,
    updated_at = now()
WHERE id = $1;

-- name: DeactivateUser :exec
UPDATE users 
SET 
    is_active = FALSE,
    updated_at = now()
WHERE id = $1;

-- name: DeleteUser :exec
DELETE FROM users 
WHERE id = $1;
