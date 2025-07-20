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

# Build statically linked binary
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
        ./api

# ---------- Runtime stage -------------------------------------------------
FROM scratch AS runtime

# Copy CA certificates for HTTPS outbound calls
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy binary
COPY --from=builder /out/backend /app/backend

# Security: Run as non-root user
USER 65532:65532
WORKDIR /app
EXPOSE 8080

ENTRYPOINT ["/app/backend"]
