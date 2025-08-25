FROM node:18-alpine AS frontend-build

WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client/ .
RUN npm run build

FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server/ ./server/
COPY . .

COPY --from=frontend-build /app/client/dist ./client/dist

ENV PYTHONPATH=/app

EXPOSE 3000

CMD ["python", "-m", "server.server"]