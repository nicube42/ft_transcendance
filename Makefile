IMAGE_NAME=transcendance_image
CONTAINER_NAME=transcendance_container
PORT=4242

build:
	docker build -t $(IMAGE_NAME) .

run: build
	docker run --name $(CONTAINER_NAME) -d -p $(PORT):80 $(IMAGE_NAME)

clean:
	docker stop $(CONTAINER_NAME) || true
	docker rm $(CONTAINER_NAME) || true

clean-image: clean
	docker rmi $(IMAGE_NAME)

stop: clean clean-image

rebuild: clean-image build

.PHONY: build run clean clean-image rebuild
