#!/bin/bash

# Apply database migrations
echo "Applying database migrations..."
sleep 4
python manage.py migrate

echo "Starting Uvicorn server..."
uvicorn backend.asgi:application --host 0.0.0.0 --port 8000 --reload