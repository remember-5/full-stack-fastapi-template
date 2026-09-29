.DEFAULT_GOAL := help
SHELL := /bin/bash

SERVICE ?=
ARGS ?=
MSG ?=
export MSG

.PHONY: help install infra init-db dev-backend dev-frontend up down logs ps \
	check lint format test-backend test-frontend build-frontend client \
	check-openapi typecheck watch build restart shell test-ui migrate migrate-docker \
	migration migration-history

help: ## Show available commands
	@awk 'BEGIN { FS = ":.*## "; print "Usage: make <target> [SERVICE=name] [ARGS=\"...\"] [MSG=\"...\"]\n" } /^[a-zA-Z0-9_-]+:.*## / { printf "  %-20s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

install: ## Install backend and frontend dependencies
	cd backend && uv sync
	bun install

infra: ## Start PostgreSQL and Mailpit for local development
	docker compose up -d --wait db mailpit

init-db: ## Wait for the database, apply migrations, and seed the administrator
	cd backend && uv run bash scripts/prestart.sh

dev-backend: ## Start the local backend with hot reload
	cd backend && uv run fastapi run --reload app/main.py

dev-frontend: ## Start the local frontend with hot reload
	bun run dev

up: ## Start the Docker stack in the background (optional SERVICE)
	docker compose up -d $(SERVICE)

down: ## Stop and remove the Docker stack, retaining data volumes
	docker compose down

logs: ## Follow Docker logs (optional SERVICE)
	docker compose logs -f $(SERVICE)

ps: ## Show Docker service status
	docker compose ps

check: ## Run lint, frontend type checks, backend tests, and OpenAPI checks
	$(MAKE) lint
	$(MAKE) typecheck
	$(MAKE) test-backend
	$(MAKE) check-openapi

lint: ## Check backend and frontend code without modifying files
	cd backend && bash scripts/lint.sh
	bun run lint

typecheck: ## Check frontend TypeScript without building
	bun run --filter frontend typecheck

format: ## Format and auto-fix backend and frontend code
	cd backend && bash scripts/format.sh
	bun run --filter frontend format

test-backend: ## Run backend tests with coverage (optional ARGS)
	cd backend && bash scripts/test.sh $(ARGS)

test-frontend: ## Run frontend Playwright tests (optional ARGS)
	cd frontend && bun run test $(ARGS)

build-frontend: ## Type-check and build the frontend for production
	bun run --filter frontend build

client: ## Export OpenAPI and regenerate the frontend client
	cd backend && uv run --locked python -m app.commands.export_openapi --write
	bun run --filter frontend generate-client

check-openapi: ## Check that the committed OpenAPI schema matches the backend
	cd backend && uv run --locked python -m app.commands.export_openapi --check

watch: ## Start Docker Compose watch mode
	docker compose watch

build: ## Build Docker images (optional SERVICE)
	docker compose build $(SERVICE)

restart: ## Restart Docker services (optional SERVICE)
	docker compose restart $(SERVICE)

shell: ## Open Bash in the running backend container
	docker compose exec backend bash

test-ui: ## Open the Playwright test UI (optional ARGS)
	cd frontend && bun run test:ui $(ARGS)

migrate: ## Apply all pending migrations using the local backend environment
	cd backend && uv run alembic upgrade head

migrate-docker: ## Apply all pending migrations in the running backend container
	docker compose exec backend alembic upgrade head

migration: ## Generate a local migration; requires MSG="describe change"
	@test -n "$$MSG" || { echo 'Usage: make migration MSG="describe change"' >&2; exit 1; }
	cd backend && uv run alembic revision --autogenerate -m "$$MSG"

migration-history: ## Show migration history using the local backend environment
	cd backend && uv run alembic history
