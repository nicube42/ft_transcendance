#!/bin/bash

set -e

# Function to wait for the database to be ready
wait_for_db() {
    echo "Waiting for db to be ready..."
    while ! nc -z db 5432; do
      sleep 0.1
    done
    echo "db started"
}

# Wait for Postgres to be ready
wait_for_db

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate

# Start your Django app
exec "$@"

gunicorn backend.wsgi:application --bind 0.0.0.0:5432
