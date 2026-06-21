# FastAPI Full-Stack Project

This is a FastAPI + React full-stack application based on the Full Stack FastAPI Template. The root README is a project overview and quick entry point. For day-to-day implementation details, use the backend and frontend README.

## Stack

Backend:

- FastAPI
- PostgreSQL
- Pydantic v2
- Alembic
- PyJWT
- SQLAlchemy
- pytest
- uv for Python dependency management

Frontend:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui and Radix UI
- TanStack Router and TanStack Query
- Playwright
- Bun for frontend scripts

Infrastructure:

- Docker Compose for local development and deployment
- Traefik reverse proxy configuration
- Mailcatcher for local email testing
- Sentry support when configured

## Project Layout

```text
.
├── backend/              # FastAPI application, migrations, backend tests
├── frontend/             # React application, generated API client, E2E tests
├── scripts/              # Repository-level helper scripts
├── compose.yml           # Main Docker Compose stack
├── compose.override.yml  # Local development Compose overrides
├── package.json          # Root Bun workspace scripts for frontend commands
└── README.md
```

## Quick Start With Docker

Copy the example environment file and update local values before running the stack:

```bash
cp .env.example .env
```

At minimum, change secrets before deployment:

- `SECRET_KEY`
- `FIRST_SUPERUSER_PASSWORD`
- `POSTGRES_PASSWORD`

Generate a secret with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Start the local Docker Compose stack:

```bash
docker compose watch
```

The Docker stack exposes:

- API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- Frontend container: `http://localhost:5173`
- Adminer: `http://localhost:8080`
- Mailcatcher: `http://localhost:1080`

For frontend work, the host Vite server is usually faster than rebuilding the
frontend Docker image. From the repository root:

```bash
bun install
bun run dev
```

The frontend development server runs at `http://localhost:5173/`.

## Local Development Without Backend Docker

You can run the backend and frontend directly on the host. You still need a
PostgreSQL database that matches `.env`; the default `.env.example` values use:

- `POSTGRES_SERVER=localhost`
- `POSTGRES_PORT=5432`
- `POSTGRES_DB=app`
- `POSTGRES_USER=postgres`
- `POSTGRES_PASSWORD=changethis`

If you want Docker only for supporting services, start just the database and Mailcatcher:

```bash
docker compose up -d db mailcatcher
```

Then install and prepare the backend:

```bash
cd backend
uv sync
source ../.venv/bin/activate
bash ./scripts/prestart.sh
```

Run the backend locally:

```bash
cd backend
fastapi run --reload app/main.py
```

In a second terminal, run the frontend locally:

```bash
bun install
bun run dev
```

The local frontend talks to the API at `http://localhost:8000` by default. To point it elsewhere, set `VITE_API_URL` in `frontend/.env`.

## Generated Frontend API Client

The frontend API client in `frontend/src/client` is generated from the backend OpenAPI schema. Do not edit generated client files by hand.

Regenerate the client after changing backend routes, request/response schemas, or OpenAPI metadata:

```bash
bash ./scripts/generate-client.sh
```

That script:

- loads `.env` or falls back to `.env.example`;
- exports the current backend OpenAPI schema into `frontend/openapi.json`;
- runs the frontend `generate-client` script;
- runs frontend lint checks.

If you only want to verify that `frontend/openapi.json` is in sync with the backend schema:

```bash
bash ./scripts/check-openapi.sh
```

Commit `frontend/openapi.json` and the regenerated files under`frontend/src/client` together with the backend API change.

## Common Commands

Install backend dependencies from the host:

```bash
cd backend
uv sync
```

Enter the backend container:

```bash
docker compose exec backend bash
```

Run backend tests:

```bash
cd backend
bash ./scripts/test.sh
```

Run backend tests inside the container:

```bash
docker compose exec backend bash scripts/tests-start.sh
```

Run frontend checks from the repository root:

```bash
bun run lint
bun run test
```

Run database migrations inside the backend container:

```bash
docker compose exec backend alembic upgrade head
```

Create a migration after backend model changes:

```bash
docker compose exec backend alembic revision --autogenerate -m "describe change"
```

Commit generated migration files.

## Documentation

- Backend development: [backend/README.md](./backend/README.md)
- Backend architecture and AI-agent rules: [backend/AGENTS.md](./backend/AGENTS.md)
- Frontend development: [frontend/README.md](./frontend/README.md)
- License and original copyright notice: [LICENSE](./LICENSE)

Use [backend/AGENTS.md](./backend/AGENTS.md) as the source of truth for backend architecture rules when making backend changes.

## Attribution

This project is based on the[Full Stack FastAPI Template](https://github.com/fastapi/full-stack-fastapi-template),
licensed under the MIT license. The original copyright notice is retained in[LICENSE](./LICENSE).

Backend architecture rules are inspired by[FastAPI Best Practices](https://github.com/zhanymkanov/fastapi-best-practices)
and are adapted for this repository in [backend/AGENTS.md](./backend/AGENTS.md).
