# ---------- Build stage ---------------------------------------------------
FROM golang:1.24.5-alpine AS builder

# Install git for private modules (if needed)
RUN apk add --no-cache git ca-certificates

# Enable Go module proxy for faster builds
ARG GOPROXY=https://proxy.golang.org
ENV GOPROXY=${GOPROXY}

# Pre-copy go.{mod,sum} first for cache optimization
WORKDIR /src
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go mod download

# Copy rest of source
COPY . .

# Build statically linked binary for API server
ENV CGO_ENABLED=0 \
    GOOS=linux \
    GOARCH=amd64

RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go build \
        -trimpath \
        -buildvcs=false \
        -ldflags="-s -w" \
        -o /out/backend \
        ./cmd/api

# Build migration binary
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go build \
        -trimpath \
        -buildvcs=false \
        -ldflags="-s -w" \
        -o /out/migrate \
        ./cmd/migrate

# ---------- Runtime stage -------------------------------------------------
FROM alpine:3.19 AS runtime

# Install runtime dependencies
RUN apk add --no-cache ca-certificates curl postgresql-client bash

# Copy binaries and SQL files
COPY --from=builder /out/backend /app/backend
COPY --from=builder /out/migrate /app/migrate
COPY --from=builder /src/sql /app/sql

# Copy and make start script executable
COPY scripts/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Security: Run as non-root user
USER 65532:65532
WORKDIR /app
EXPOSE 8080

ENTRYPOINT ["/app/start.sh"]
