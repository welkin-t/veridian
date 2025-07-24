# Database Management

## PostgreSQL Setup with Goose Migrations

The PostgreSQL database is configured with the following best practices:

### Key Features
- **Pinned Version**: Uses `postgres:16.2-alpine` to avoid unexpected version upgrades
- **Named Volume**: Data persists in `pgdata` volume managed by Docker
- **Health Checks**: Uses `pg_isready` for proper startup coordination
- **Security**: Runs as non-root user (postgres:999) with security constraints
- **Goose Migrations**: Professional migration system with up/down support
- **Auto-Migration**: Backend automatically runs migrations on startup

### Migration System

Your SQL files use **Goose** migration format:
```sql
-- +goose Up
CREATE TABLE users (...);

-- +goose Down
DROP TABLE IF EXISTS users;
```

### Environment Variables
Configure these in your `.env` file:
```env
POSTGRES_DB=veridian
POSTGRES_USER=veridian
POSTGRES_PASSWORD=veridian_dev_password
DATABASE_URL=postgresql://veridian:veridian_dev_password@db:5432/veridian
```

### Usage

Start the database with other services:
```bash
docker compose up -d
```

Connect to the database:
```bash
# From host (if port 5432 is exposed)
psql -h localhost -U veridian -d veridian

# From another container
docker compose exec db psql -U veridian -d veridian

# Using docker compose directly
docker compose exec db psql -U veridian -d veridian
```

### Migration Commands

**Check migration status:**
```bash
make backend-migrate-status
# or directly:
cd backend && goose -dir sql/schemas postgres "$DATABASE_URL" status
```

**Run migrations manually:**
```bash
make backend-migrate
# or directly:
cd backend && go run ./cmd/migrate/main.go
```

**Create new migration:**
```bash
cd backend && goose -dir sql/schemas create add_new_table sql
```

**Rollback migrations (CAREFUL!):**
```bash
cd backend && goose -dir sql/schemas postgres "$DATABASE_URL" down
```

**Reset all migrations (DESTRUCTIVE!):**
```bash
make backend-migrate-reset
```

### Schema Changes

1. **Create new migration file:**
   ```bash
   cd backend && goose -dir sql/schemas create your_migration_name sql
   ```

2. **Edit the generated file** with your schema changes:
   ```sql
   -- +goose Up
   ALTER TABLE users ADD COLUMN phone VARCHAR(20);

   -- +goose Down
   ALTER TABLE users DROP COLUMN phone;
   ```

3. **Run migration:**
   - Automatically on container startup
   - Or manually: `make backend-migrate`

### Database Management

**View logs:**
```bash
docker compose logs db
```

**Backup database:**
```bash
docker compose exec db pg_dump -U veridian veridian > backup.sql
```

**Restore database:**
```bash
docker compose exec -T db psql -U veridian -d veridian < backup.sql
```

**Reset database (DESTRUCTIVE):**
```bash
docker compose down -v
docker volume rm veridian_pgdata
docker compose up -d
```

### Production Notes

For production deployment:
1. Remove the port mapping (`5432:5432`) to keep database internal
2. Use stronger passwords and proper secrets management
3. Consider using managed PostgreSQL service instead
4. Set up automated backups with `pg_dump` or `pg_basebackup`
5. Adjust resource limits based on actual usage
6. Use Goose migrations in CI/CD pipeline
7. Test migrations on staging before production

### Migration Best Practices

1. **Always write Down migrations** for rollback capability
2. **Test migrations thoroughly** on development data
3. **Use transactions** where possible (Goose does this automatically)
4. **Avoid destructive changes** without proper backups
5. **Sequential naming** ensures proper order execution
6. **Idempotent operations** use `IF EXISTS` / `IF NOT EXISTS`

### Troubleshooting

**Migration stuck or failed:**
```bash
# Check current status
make backend-migrate-status

# Manual rollback (if safe)
cd backend && goose -dir sql/schemas postgres "$DATABASE_URL" down

# Fix migration file and retry
make backend-migrate
```

**Database schema drift:**
```bash
# Compare expected vs actual schema
docker compose exec db pg_dump -s -U veridian veridian > current_schema.sql
```
