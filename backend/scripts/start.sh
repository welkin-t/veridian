#!/bin/bash
set -e

echo "🚀 Starting Veridian backend with database migrations..."

echo "⏳ Waiting for database to be ready..."
until pg_isready -h ${DB_HOST:-db} -p ${DB_PORT:-5432} -U ${DB_USER:-veridian}; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is ready!"

echo "🔄 Running database migrations..."
/app/migrate

echo "🎯 Starting API server..."
exec /app/backend
