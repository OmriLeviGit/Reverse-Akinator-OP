# Frontend build stage
FROM node:18-alpine AS frontend-build

WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client/ .
RUN npm run build

# Main application stage
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies and uv
RUN apt-get update && apt-get install -y \
    git \
    cron \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Set environment variables for uv
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

# Copy dependency files first for better caching
COPY pyproject.toml uv.lock README.md ./

# Install dependencies using uv (cached layer)
RUN uv sync --frozen --no-dev --extra-index-url https://download.pytorch.org/whl/cpu

# Copy application source code and other files
COPY src/ ./src/
COPY .env* ./

# Add .venv/bin to PATH
ENV PATH="/app/.venv/bin:$PATH"

# Copy frontend build from previous stage
COPY --from=frontend-build /app/client/dist ./client/dist

# Copy and set up scripts
COPY scripts/ ./scripts/
RUN chmod +x /app/scripts/backup-db.sh

# Set up cron job
RUN echo "0 2 * * * cd /app && /app/scripts/backup-db.sh >> /var/log/backup.log 2>&1" | crontab -

ENV PYTHONPATH=/app/src

EXPOSE 3000

# Package is already installed via uv sync

CMD service cron start && python -m guessing_game.app