.PHONY: run-backend backend-tidy docker-build-backend run-frontend run-frontend-dev docker-build-frontend compose-up compose-up-logs compose-up-prod compose-down compose-down-volumes compose-logs compose-watch compose-test compose-security-scan compose-clean compose-smoke-test

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

# Docker Compose targets (2025 best practices)
# Start development environment
compose-up:
	docker compose up --build -d

# Start development environment with logs
compose-up-logs:
	docker compose up --build

# Start production environment  
compose-up-prod:
	docker compose --profile prod up --build -d

# Stop all services
compose-down:
	docker compose down

# Stop and remove volumes
compose-down-volumes:
	docker compose down -v

# View service logs
compose-logs:
	docker compose logs -f

# Watch for file changes and rebuild (modern hot-reload)
compose-watch:
	docker compose watch

# Run health checks and smoke tests
compose-test:
	@echo "Starting services..."
	@docker compose up --build -d
	@echo "Waiting for services to be healthy..."
	@sleep 10
	@echo "Testing backend health endpoint..."
	@curl -f http://localhost:8080/health || (docker compose logs backend && exit 1)
	@echo "Testing frontend..."
	@curl -f http://localhost:5173 || (docker compose logs frontend && exit 1)
	@echo "✅ All compose services are healthy!"
	@docker compose down

# Security scan all images with Trivy
compose-security-scan:
	@echo "Scanning backend image for vulnerabilities..."
	@docker compose build backend
	@trivy image veridian-backend:latest || echo "⚠️ Trivy not installed or scan failed"
	@echo "Scanning frontend image for vulnerabilities..."
	@docker compose build frontend
	@trivy image veridian-frontend:latest || echo "⚠️ Trivy not installed or scan failed"

# Clean up all containers, images, and cache
compose-clean:
	docker compose down -v --remove-orphans
	docker system prune -f
	docker builder prune -f

# CI smoke test (mimics GitHub Actions locally)
compose-smoke-test:
	@echo "Running CI-style smoke tests locally..."
	@export GITHUB_SHA=local-test && \
	docker compose build backend frontend && \
	docker tag veridian-backend:latest veridian-backend:local-test && \
	docker tag veridian-frontend:latest veridian-frontend:local-test && \
	docker compose -f docker-compose.yml -f docker-compose.smoke.yml --project-name smoke up -d && \
	echo "Waiting for services..." && sleep 15 && \
	curl --fail --retry 3 --retry-delay 2 http://localhost:8080/health && \
	echo "✅ Backend health check passed" && \
	curl --fail --retry 3 --retry-delay 2 http://localhost:5173 && \
	echo "✅ Frontend smoke test passed" && \
	docker compose -f docker-compose.yml -f docker-compose.smoke.yml --project-name smoke down -v
