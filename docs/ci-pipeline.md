# GitHub Actions CI Pipeline Documentation

## Overview

The CI pipeline automatically builds, tests, and validates the Veridian application on every push and pull request.

## Workflow Stages

### 1. Test Stage
- **Backend**: Runs Go unit tests with PostgreSQL service
- **Frontend**: Runs npm lint and tests

### 2. Build Stage
- **Multi-arch Docker builds** using buildx
- **Layer caching** via GitHub Actions cache
- **Conditional push** to GitHub Container Registry (GHCR) on main branch
- **Image artifacts** saved for smoke testing

### 3. Smoke Test Stage
- **Docker Compose** orchestration with pre-built images
- **Health checks** with automatic retries
- **API testing** via curl against `/health` endpoint
- **Frontend validation** to ensure React app is served correctly

### 4. Security Scan Stage (main branch only)
- **Trivy vulnerability scanning**
- **SARIF upload** to GitHub Security tab

## Container Registry

Images are pushed to GitHub Container Registry (GHCR):
- `ghcr.io/welkin-t/veridian-backend:latest`
- `ghcr.io/welkin-t/veridian-frontend:latest`

## Local Testing

Test the CI pipeline locally:

```bash
# Run smoke tests locally (mimics CI)
make compose-smoke-test

# Regular compose testing
make compose-test
```

## Configuration Files

- `.github/workflows/ci.yml` - Main CI workflow
- `docker-compose.smoke.yml` - Smoke test overrides
- `Makefile` - Local development and testing targets

## Troubleshooting

### Common Issues

1. **Health check failures**: Services may need more time to start
2. **Port conflicts**: Ensure ports 8080 and 5173 are available
3. **Image loading**: Buildx artifacts are loaded as tar files

### Debugging

View logs from failed runs:
```bash
docker compose -f docker-compose.yml -f docker-compose.smoke.yml logs
```

## GitHub Actions Permissions

The workflow requires:
- `contents: read` - Repository access
- `packages: write` - GHCR push permissions

## Performance Features

- **Parallel builds** for backend and frontend
- **BuildKit caching** reduces build times by ~80%
- **Image artifacts** avoid registry pulls during smoke tests
- **Health check polling** with configurable retries
