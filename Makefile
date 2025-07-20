.PHONY: run-backend backend-tidy docker-build-backend run-frontend run-frontend-dev docker-build-frontend

# Backend targets
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

# Frontend targets
# Run the frontend development server
run-frontend:
	cd frontend && npm run dev

# Run the frontend in development container
run-frontend-dev:
	DOCKER_BUILDKIT=1 docker build --target development -t veridian-frontend:dev -f frontend/Dockerfile frontend/
	docker run -p 5173:5173 --name veridian-frontend-dev --rm veridian-frontend:dev

# Build frontend Docker image (production)
docker-build-frontend:
	DOCKER_BUILDKIT=1 docker build \
		--build-arg BUILDKIT_INLINE_CACHE=1 \
		--target production \
		-t veridian-frontend:latest \
		-f frontend/Dockerfile \
		frontend/

# Run frontend production container
run-frontend-prod:
	docker run -p 8080:8080 --name veridian-frontend-prod --rm veridian-frontend:latest

# Validate frontend containers
docker-test-frontend:
	@echo "Building production image..."
	@make docker-build-frontend
	@echo "Testing production container..."
	@docker run -d -p 8080:8080 --name veridian-frontend-test veridian-frontend:latest
	@sleep 3
	@curl -f http://localhost:8080/health || (docker logs veridian-frontend-test && exit 1)
	@curl -f http://localhost:8080/ || (docker logs veridian-frontend-test && exit 1)
	@docker stop veridian-frontend-test
	@docker rm veridian-frontend-test
	@echo "✅ Frontend container tests passed!"
