# Makefile for News Backend Docker Management

.PHONY: help build up down restart logs shell db-shell migrate seed clean backup restore

# Default target
help:
	@echo "Available commands:"
	@echo "  make build       - Build Docker images"
	@echo "  make up          - Start all services"
	@echo "  make down        - Stop all services"
	@echo "  make restart     - Restart all services"
	@echo "  make logs        - View logs"
	@echo "  make shell       - Access backend shell"
	@echo "  make db-shell    - Access database shell"
	@echo "  make migrate     - Run database migrations"
	@echo "  make seed        - Seed database with sample data"
	@echo "  make backup      - Backup database"
	@echo "  make restore     - Restore database"
	@echo "  make clean       - Remove containers and volumes"
	@echo "  make dev         - Start in development mode"
	@echo "  make prod        - Start with production config"

# Build images
build:
	docker-compose build

# Start services
up:
	docker-compose up -d
	@echo "Services started!"
	@echo "Backend: http://localhost:5000"
	@echo "PgAdmin: http://localhost:5050 (if enabled)"

# Stop services
down:
	docker-compose down

# Restart services
restart:
	docker-compose restart

# View logs
logs:
	docker-compose logs -f

# View backend logs only
logs-backend:
	docker-compose logs -f backend

# View database logs only
logs-db:
	docker-compose logs -f postgres

# Access backend shell
shell:
	docker-compose exec backend sh

# Access database shell
db-shell:
	docker-compose exec postgres psql -U postgres -d news_db

# Run migrations
migrate:
	docker-compose exec backend npx prisma migrate deploy

# Generate Prisma client
generate:
	docker-compose exec backend npx prisma generate

# Seed database
seed:
	docker-compose exec backend npx prisma db seed

# Open Prisma Studio
studio:
	docker-compose exec backend npx prisma studio

# Backup database
backup:
	@mkdir -p backups
	@echo "Creating backup..."
	docker-compose exec postgres pg_dump -U postgres news_db > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Backup created in backups/ directory"

# Restore database from latest backup
restore:
	@echo "Restoring from latest backup..."
	docker-compose exec -T postgres psql -U postgres news_db < $(shell ls -t backups/*.sql | head -1)
	@echo "Database restored!"

# Clean up everything
clean:
	docker-compose down -v
	@echo "All containers and volumes removed!"

# Deep clean (including images)
clean-all:
	docker-compose down -v --rmi all
	@echo "Everything cleaned!"

# Start in development mode
dev:
	docker-compose --profile tools up -d

# Start with production profile
prod:
	docker-compose --profile production up -d

# View container status
ps:
	docker-compose ps

# View resource usage
stats:
	docker stats

# Check health
health:
	@curl -s http://localhost:5000/health || echo "Backend not responding"

# Setup (first time)
setup:
	@echo "Setting up News Backend..."
	cp .env.docker .env
	@echo ".env file created. Please edit it with your configuration."
	@echo "Run 'make build' then 'make up' to start the services."

# Full rebuild
rebuild:
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d