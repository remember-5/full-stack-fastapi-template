# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack web application template: **FastAPI** backend + **React/TypeScript** frontend. Monorepo with `backend/` and `frontend/` as separate workspaces managed by **uv** (Python) and **bun** (JS).

## Common Commands

### Running the Stack (Docker Compose — recommended)
```bash
docker compose watch                    # Start all services with hot-reload
docker compose up -d                    # Start in background
docker compose logs backend -f          # Tail backend logs
```

### Backend
```bash
cd backend
uv sync                                 # Install dependencies
fastapi dev app/main.py                 # Dev server on :8000 (hot-reload)

# Lint & type-check
bash scripts/lint.sh                    # Runs: mypy app && ruff check app && ruff format app --check

# Tests (requires running PostgreSQL — use docker compose for DB)
bash scripts/test.sh                    # coverage run + pytest + report
uv run pytest tests/                    # Run all tests
uv run pytest tests/api/routes/test_items.py          # Single test file
uv run pytest tests/api/routes/test_items.py::test_create_item  # Single test

# Alembic migrations
uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head
```

### Frontend
```bash
cd frontend
bun install                             # Install dependencies
bun run dev                             # Dev server on :5173
bun run build                           # TypeScript check + Vite build
bun run lint                            # Biome check --write --unsafe
bun run test                            # Playwright E2E tests
```

### Regenerate Frontend API Client
```bash
# Requires backend running (exports OpenAPI JSON, generates TypeScript client)
bash scripts/generate-client.sh
```

### Pre-commit Hooks
```bash
cd backend && uv run prek install -f    # Install hooks (uses prek, not pre-commit)
uv run prek run --all-files             # Run all hooks manually
```

## Architecture

### Backend (`backend/`)
- **FastAPI** with **SQLModel** (SQLAlchemy + Pydantic hybrid) ORM
- **PostgreSQL 18** via `psycopg` (psycopg3) driver
- **Alembic** for DB migrations (auto-runs on container start via `prestart` service)
- **JWT auth** (HS256 via `pyjwt`) with **Argon2** password hashing (bcrypt legacy fallback via `pwdlib`)
- API routes: `backend/app/api/routes/` — `login`, `users`, `items`, `utils`, `private` (local-only)
- Settings via `pydantic-settings` reading from root `.env` file, split into sub-configs (`DatabaseSettings`, `EmailSettings`)
- Email via `emails` library + Jinja2 templates (MJML source → compiled HTML in `email-templates/`)
- Sentry integration (disabled in `local` environment)
- API docs hidden in production (only available in `local`/`staging`)

#### Domain-based structure
Code is organized by domain, each with its own models, service, dependencies, and constants:

```
backend/app/
├── main.py                     # App entry point, CORS, Sentry, global DomainError handler
├── api/
│   ├── main.py                 # Router mounting
│   ├── deps.py                 # Common dependencies (SessionDep, CurrentUser, etc.)
│   └── routes/                 # Thin route handlers (HTTP protocol only)
│       ├── login.py
│       ├── users.py
│       ├── items.py
│       ├── utils.py
│       └── private.py          # Local-only, uses service layer
├── core/
│   ├── config.py               # Settings + DatabaseSettings + EmailSettings
│   ├── security.py             # JWT token creation, password hashing
│   └── db.py                   # Engine, naming convention, init_db
├── common/
│   ├── models.py               # Shared models (Message, Token, TokenPayload, NewPassword), get_datetime_utc
│   └── exceptions.py           # DomainError base class, InvalidResetTokenError, CredentialsValidationError
├── users/
│   ├── models.py               # User, UserCreate, UserUpdate, UserPublic, etc.
│   ├── service.py              # Business logic (create, update, authenticate, etc.)
│   ├── dependencies.py         # valid_user_id, ValidUser
│   ├── exceptions.py           # UserNotFoundError, UserAlreadyExistsError, etc.
│   └── constants.py            # Success message constants (PASSWORD_UPDATED, USER_DELETED)
├── items/
│   ├── models.py               # Item, ItemCreate, ItemUpdate, ItemPublic, etc.
│   ├── service.py              # Business logic (create, update, delete, get_items)
│   ├── dependencies.py         # valid_item_id, ValidItem, valid_owned_item (chained)
│   ├── exceptions.py           # ItemNotFoundError, ItemPermissionError
│   └── constants.py            # Success message constants (ITEM_DELETED)
├── utils.py                    # Email utilities (send, generate templates)
├── initial_data.py             # Seed superuser
└── backend_pre_start.py        # DB readiness check
```

Key conventions:
- **Routes are thin** — only HTTP protocol handling, business logic in `service.py`
- **Dependencies chain** — e.g. `valid_owned_item` depends on `valid_item_id` (FastAPI caches per request)
- **Domain exceptions** — each domain defines exception classes inheriting `DomainError(status_code, detail)`; a single global handler in `main.py` converts any `DomainError` to the matching HTTP response. No `HTTPException` in the codebase.
- **Constants are for success messages only** — error messages live in exception classes as the single source of truth
- **Settings sub-configs** — access via `settings.db.POSTGRES_*`, `settings.email.SMTP_*`

Key files:
- `app/core/config.py` — `Settings`, `DatabaseSettings`, `EmailSettings`
- `app/core/db.py` — Engine + DB naming convention (`pk_`, `fk_`, `ix_`, `uq_`, `ck_`)
- `app/api/deps.py` — Dependency injection (`SessionDep`, `CurrentUser`)
- `app/common/exceptions.py` — `DomainError` base class (all domain exceptions inherit from it, carrying `status_code` + `detail`)

### Frontend (`frontend/`)
- **React 19** + **TypeScript 5.9** + **Vite 7** (SWC plugin)
- **TanStack Router** (file-based routing in `src/routes/`, auto-generates `routeTree.gen.ts`)
- **TanStack Query** (React Query v5) for server state
- **Tailwind CSS v4** + **shadcn/ui** components (in `src/components/ui/`)
- **Biome v2** for linting/formatting
- API client auto-generated from OpenAPI spec via `@hey-api/openapi-ts` → `src/client/`
- Forms: `react-hook-form` + `zod v4` validation
- Auth guard in `_layout.tsx` redirects unauthenticated users to `/login`

### Auto-generated Files (do not edit manually)
- `frontend/src/client/` — Generated API client (regenerate via `scripts/generate-client.sh`)
- `frontend/src/routeTree.gen.ts` — Generated by TanStack Router plugin
- `backend/app/email-templates/build/` — Compiled from MJML sources

### Docker Services
- `db` — PostgreSQL 18
- `prestart` — Runs migrations + seeds superuser
- `backend` — FastAPI (port 8000)
- `frontend` — Nginx serving built React app (port 80→5173 in dev)
- `mailcatcher` — Local email testing (SMTP 1025, Web UI 1080)
- Traefik reverse proxy routes: `api.<DOMAIN>` → backend, `dashboard.<DOMAIN>` → frontend

## Code Style & Conventions

### Backend
- Python ≥3.10, mypy strict mode
- Ruff rules: pycodestyle, pyflakes, isort, flake8-bugbear, comprehensions, pyupgrade, no print statements
- Alembic directory excluded from ruff and mypy
- Alembic migration naming: `YYYY-MM-DD_slug_revid.py` (via `file_template` in `alembic.ini`)
- DB index naming convention: `pk_<table>`, `fk_<table>_<col>_<ref_table>`, `ix_<col>`, `uq_<table>_<col>`, `ck_<table>_<name>`
- Tests require a running PostgreSQL instance; CI enforces ≥90% coverage

### Frontend
- Biome excludes: `dist/`, `src/routeTree.gen.ts`, `src/client/`, `src/components/ui/`
- Path alias: `@` maps to `src/`
- Dark mode default via `next-themes`

## Environment
- **`.env.example`** — Committed template with safe placeholder values (`changethis`). Developers copy to `.env` locally.
- **`.env`** — Local config (gitignored). Shared by backend (pydantic-settings) and Docker Compose.
- **`.env.local`** — Optional personal overrides (gitignored). Values here override `.env`, just like frontend's `.env.local` pattern.
- **Priority chain**: environment variables > `.env.local` > `.env` > code defaults
- Settings via `pydantic-settings` with `env_file=("../.env", "../.env.local")` — later files override earlier ones
- Sub-configs: `settings.db.POSTGRES_*`, `settings.email.SMTP_*`
- Key variables: `DOMAIN`, `SECRET_KEY`, `FIRST_SUPERUSER`/`FIRST_SUPERUSER_PASSWORD`, `POSTGRES_*`, `SMTP_*`
- Production/CI: inject via environment variables (highest priority), no env files needed
