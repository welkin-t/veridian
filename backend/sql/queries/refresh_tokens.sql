-- name: CreateRefreshToken :one
INSERT INTO refresh_tokens (
    user_id,
    token_hash,
    expires_at,
    user_agent,
    ip_address
) VALUES (
    $1, $2, $3, $4, $5
) RETURNING *;

-- name: GetRefreshToken :one
SELECT * FROM refresh_tokens 
WHERE token_hash = $1 
  AND is_revoked = FALSE 
  AND expires_at > now();

-- name: UpdateRefreshTokenLastUsed :exec
UPDATE refresh_tokens 
SET last_used = now()
WHERE id = $1;

-- name: RevokeRefreshToken :exec
UPDATE refresh_tokens 
SET is_revoked = TRUE
WHERE token_hash = $1;

-- name: RevokeAllUserRefreshTokens :exec
UPDATE refresh_tokens 
SET is_revoked = TRUE
WHERE user_id = $1;

-- name: DeleteExpiredRefreshTokens :exec
DELETE FROM refresh_tokens 
WHERE expires_at < now() OR is_revoked = TRUE;

-- name: GetUserRefreshTokens :many
SELECT * FROM refresh_tokens 
WHERE user_id = $1 
  AND is_revoked = FALSE 
  AND expires_at > now()
ORDER BY created_at DESC;
