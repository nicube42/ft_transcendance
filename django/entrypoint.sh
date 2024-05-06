#!/bin/bash

echo "Applying database migrations..."
sleep 4
python manage.py migrate
python manage.py collectstatic --noinput --verbosity 2

echo "Starting Uvicorn server..."
uvicorn backend.asgi:application --host 0.0.0.0 --port 8000 --reload