build:
	docker-compose build

up:
	docker-compose up

down:
	docker-compose down

logs:
	docker-compose logs -f

.PHONY: build up down migrate makemigrations createsuperuser shell logs
