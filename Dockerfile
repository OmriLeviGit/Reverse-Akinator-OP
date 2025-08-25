FROM node:18-alpine AS frontend-build

WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client/ .
RUN npm run build

FROM python:3.11-slim

WORKDIR /app

# Install git, cron, and other necessary packages
RUN apt-get update && apt-get install -y \
    git \
    cron \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server/ ./server/
COPY . .

COPY --from=frontend-build /app/client/dist ./client/dist

# Copy backup script and make it executable
COPY backup-db.sh /app/backup-db.sh
RUN chmod +x /app/backup-db.sh

# Set up cron job (runs daily at 2 AM)
RUN echo "0 2 * * * cd /app && /app/backup-db.sh >> /var/log/backup.log 2>&1" | crontab -

ENV PYTHONPATH=/app

EXPOSE 3000

# Start cron in background, then start the main application
CMD service cron start && python -m server.server