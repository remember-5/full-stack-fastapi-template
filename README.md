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
- Mailpit for local email testing
- Sentry support when configured

## Project Layout

```text
.
├── backend/              # FastAPI application, migrations, backend tests
├── frontend/             # React application, generated API client, E2E tests
├── scripts/              # Repository-level helper scripts
├── compose.yml           # Main Docker Compose stack
├── compose.override.yml  # Local development Compose overrides
├── Makefile              # Common development commands from the repository root
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
- Mailpit: `http://localhost:8025`

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

If you want Docker only for supporting services, start just the database and Mailpit:

```bash
docker compose up -d db mailpit
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
make client
```

That target:

- uses backend Settings to load `.env`, falling back to `.env.example` only when
  `.env` is absent; exported environment variables take precedence;
- exports the current backend OpenAPI schema into `frontend/openapi.json`;
- runs the frontend `generate-client` script.

If you only want to verify that `frontend/openapi.json` is in sync with the backend schema:

```bash
make check-openapi
```

The check compares JSON content, ignoring whitespace and object key order, and
never rewrites the snapshot. Both commands share
`backend/app/commands/export_openapi.py`; writing uses an atomic replacement.
Neither command needs a running API server or database. Set `APP_ENV_FILE` to an
absolute dotenv path to explicitly select configuration for the command.

Commit `frontend/openapi.json` and the regenerated files under `frontend/src/client`
together with the backend API change. `make check-openapi` checks the schema only;
it does not verify the generated TypeScript files.

Use a clean, disposable checkout with dependencies installed to verify
both the schema and generated client:

```bash
make client
git diff --exit-code -- frontend/openapi.json frontend/src/client
test -z "$(git status --porcelain -- frontend/openapi.json frontend/src/client)"
```

The status check also detects newly generated untracked files. Run this in a
separate checkout because regeneration writes files. Run `make check` for
lint, type checks, backend tests, and schema consistency.

## Local Automated Tests

Run tests locally against your development services. After configuring `.env`,
install dependencies and start PostgreSQL and Mailpit:

```bash
make install
make infra
make init-db
```

Run backend tests without starting the API server:

```bash
make test-backend
# Run a subset:
make test-backend ARGS="-x -k login"
```

For browser tests, install the browser matching Playwright **1.62.1** once (and
again after a Playwright upgrade), then start the local backend from the root:

```bash
(cd frontend && bunx playwright install chromium)
make dev-backend
```

In another terminal, run:

```bash
make test-frontend
# Run only password recovery tests:
make test-frontend ARGS="reset-password.spec.ts"
# Or open the interactive test UI:
make test-ui
```

Playwright starts or reuses the local Vite server. Browser tests create and modify
users in the configured development database. Backend tests use the separate test
database described below.

Backend coverage is saved to `backend/htmlcov/`. Browser reports are saved to
`frontend/playwright-report/` and `frontend/test-results/`, including JUnit output,
failure screenshots, and traces. Open the HTML report from `frontend/` with
`bunx playwright show-report`.

### Playwright in Docker

To run browser tests in the Playwright **1.62.1** image, use the existing
development Compose services from the repository root:

```bash
docker compose up -d --build --wait backend mailpit
docker compose run --rm --build playwright
# Run only password recovery tests:
docker compose run --rm playwright bunx playwright test reset-password.spec.ts
```

The `playwright` service has a `test` profile, so ordinary `docker compose up`
does not run tests. Explicitly targeting it with `docker compose run` activates
it. Playwright starts Vite inside its container and connects to
`http://backend:8000` and `http://mailpit:8025`. Tests use the configured development
database, and reports are written to the same host directories as local runs.
Use either the host backend or the Docker backend to avoid port conflicts.

### Local Email with Mailpit

`make infra` starts PostgreSQL and Mailpit. Open `http://localhost:8025` to inspect
captured emails. For a backend running on the host, configure `.env` with
`SMTP_HOST=localhost`, `SMTP_PORT=1025`, `SMTP_TLS=False`, and
`MAILPIT_HOST=http://localhost:8025` for browser tests. Existing `.env` files are
not automatically updated. The Docker backend uses `SMTP_HOST=mailpit`.
Password recovery tests search Mailpit by the test user's unique recipient address.
Mailpit is for local development and tests; deployments should use their SMTP provider.

## Common Commands

Run `make` or `make help` from the repository root to list all shortcuts. The
Makefile uses the existing scripts and requires Make, Bash, uv, Bun, and Docker
Compose for their respective commands.

For local development, first copy `.env.example` to `.env` and configure it as
described above, then run:

```bash
make install
make infra
make init-db
make dev-backend
```

In a second terminal, run `make dev-frontend`. The local development servers run
in the foreground. Use either the local servers or the full Docker stack to
avoid binding the same ports twice.

| Command | Purpose |
|---|---|
| `make up` / `make down` | Start or remove the Docker stack; `down` retains data volumes. |
| `make watch` | Start Docker Compose watch mode. |
| `make ps` / `make logs` | Inspect service status or follow logs. |
| `make build` / `make restart` | Build Docker images or restart services. |
| `make shell` | Open Bash in the running backend container. |
| `make lint` / `make format` | Check code or apply formatting and automatic fixes. |
| `make check` | Run lint, frontend type checks, backend tests, and OpenAPI consistency checks. |
| `make typecheck` | Check frontend TypeScript without building. |
| `make test-backend` | Run backend tests with terminal and HTML coverage reports. |
| `make test-frontend` / `make test-ui` | Run Playwright tests or open their UI. |
| `make build-frontend` | Type-check and build the frontend. |
| `make client` / `make check-openapi` | Regenerate the API client or verify schema consistency. |
| `make migrate` / `make migrate-docker` | Apply migrations locally or in the running backend container. |
| `make migration MSG="describe change"` | Generate a migration locally; review and commit the resulting file. |
| `make migration-history` | Show local Alembic migration history. |

Use `SERVICE` to select a service for `up`, `logs`, `build`, or `restart`. Use
`ARGS` to pass extra test arguments, quoting multi-word argument values inside
the outer quotes:

```bash
make logs SERVICE=backend
make restart SERVICE=backend
make test-backend ARGS="-x -k 'login or signup'"
make test-frontend ARGS="--project=chromium"
make migration MSG="add users index"
```

Backend tests require the configured PostgreSQL instance. Playwright tests
require the backend and Mailpit; Playwright starts or reuses the local Vite
server. `make check` does not run Playwright tests or the frontend build.
Its steps run sequentially through the individual Make targets and stop on failure.
Frontend type checks use the same configuration as the production build;
Playwright test files are excluded.
`make format` includes the existing frontend script's unsafe automatic fixes;
review its changes before committing.

`make test-backend` runs `backend/scripts/test.sh` against the configured
PostgreSQL instance using a separate test database.

The underlying commands remain available:

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
