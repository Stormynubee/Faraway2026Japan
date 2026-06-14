# Bogie Flow — one-command local dev
.PHONY: dev install test build docker

dev:
	npm run dev:all

install:
	python -m pip install -r requirements.txt
	npm install

test:
	python -m pytest tests/ -q
	npm run test

build:
	npm run build

docker:
	docker build -t bogie-flow .
	docker run --rm -p 8000:8000 -e PORT=8000 bogie-flow
