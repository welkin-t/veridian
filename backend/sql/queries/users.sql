-- name: CreateUser :one
INSERT INTO users (
    email,
    hashed_password
) VALUES (
    $1, $2
) RETURNING *;

-- name: GetUserByID :one
SELECT * FROM users 
WHERE id = $1;

-- name: GetUserByEmail :one
SELECT * FROM users 
WHERE email = $1;

-- name: UpdateUserPassword :one
UPDATE users 
SET 
    hashed_password = $2,
    updated_at = now()
WHERE id = $1
RETURNING *;

-- name: DeleteUser :exec
DELETE FROM users 
WHERE id = $1;
