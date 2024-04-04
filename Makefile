build:
	docker-compose build

up:
	docker-compose up

down:
	docker-compose down

logs:
	docker-compose logs -f

makemigrations:
	docker-compose run --rm django python manage.py makemigrations

migrate:
	docker-compose run --rm django python manage.py migrate

collectstatic:
	docker-compose run --rm django python manage.py collectstatic --no-input


.PHONY: build up down migrate makemigrations createsuperuser shell logs
