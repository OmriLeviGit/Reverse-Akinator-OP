# Stage 1: Build the frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app/client

# Copy package files
COPY client/package*.json ./
RUN npm install

# Copy client source and build
COPY client/ .
RUN npm run build

# Stage 2: Python backend with built frontend
FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire server code
COPY server/ ./server/
COPY . .

# Copy built frontend from stage 1
COPY --from=frontend-build /app/client/dist ./client/dist

# Set environment variables
ENV PYTHONPATH=/app

# Expose port 3000
EXPOSE 3000

# Run the server
CMD ["python", "server/server.py"]