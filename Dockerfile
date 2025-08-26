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

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    cron \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY server/ ./server/

# Copy frontend build from previous stage
COPY --from=frontend-build /app/client/dist ./client/dist

# Copy and set up backup script
COPY backup-db.sh /app/backup-db.sh
RUN chmod +x /app/backup-db.sh

# Set up cron job
RUN echo "0 2 * * * cd /app && /app/backup-db.sh >> /var/log/backup.log 2>&1" | crontab -

ENV PYTHONPATH=/app

EXPOSE 3000

CMD service cron start && python -m server.server