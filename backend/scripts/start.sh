#!/bin/bash
set -e

echo "🚀 Starting Veridian backend with database migrations..."

echo "⏳ Waiting for database to be ready..."
until pg_isready -h db -p 5432 -U ${POSTGRES_USER:-veridian}; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is ready!"

echo "🔄 Running database migrations..."
/app/migrate

echo "🎯 Starting API server..."
exec /app/backend
