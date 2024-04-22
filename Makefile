all: build up

linux-build:
	docker compose -f docker-compose.yml -p trancendance build
linux-up:
	docker compose -f docker-compose.yml -p trancendance up	

linux-down:
	docker compose -f docker-compose.yml -p trancendance down
build:
	docker-compose build

up:
	docker-compose up -d

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

clean: down
	docker-compose down --volumes

re: clean all migrate

.PHONY: build up down migrate makemigrations logs
