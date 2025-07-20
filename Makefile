.PHONY: run-backend backend-tidy docker-build-backend

# Run the backend API server
run-backend:
	cd backend && go run ./api

# Tidy up backend dependencies
backend-tidy:
	cd backend && go mod tidy

# Build backend Docker image
docker-build-backend:
	docker build \
		--build-arg BUILDKIT_INLINE_CACHE=1 \
		--target runtime \
		-t veridian-backend:dev \
		-f backend/Dockerfile \
		backend/
