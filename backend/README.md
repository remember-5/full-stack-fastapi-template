# FastAPI Project - Backend

This directory contains the FastAPI backend application, Alembic migrations, backend tests, and backend-specific helper scripts.

For strict backend architecture rules, read [AGENTS.md](./AGENTS.md). This README is the developer-facing workflow and convention guide.

## Requirements

- Python 3.14+; `.python-version` pins local development to 3.14.7, matching the Docker image.
- [Docker](https://www.docker.com/)
- [uv](https://docs.astral.sh/uv/) for Python package and environment management

## Docker Compose

Start the local development environment from the repository root:

```console
$ docker compose watch
```

Enter the running backend container:

```console
$ docker compose exec backend bash
```

Inside the container, the working directory is `/app/backend` and application
code is under `/app/backend/app`. The image copies this code during the build;
Compose Watch synchronizes subsequent host changes into `/app/backend`.

## General Workflow

From `./backend/`, install dependencies with:

```console
$ uv sync
```

Activate the virtual environment with:

```console
$ source ../.venv/bin/activate
```

Make sure your editor is using the Python interpreter at
`.venv/bin/python` from the repository root.

Backend code is organized by domain under `./backend/app/modules/`.

- SQLAlchemy ORM models live in `./backend/app/modules/{domain}/models.py`.
- Pydantic request and response schemas live in `./backend/app/modules/{domain}/schemas.py`.
- Business logic and database access live in `./backend/app/modules/{domain}/service.py`.
- Router dependencies live in `./backend/app/modules/{domain}/dependencies.py`.
- API endpoints live in `./backend/app/modules/{domain}/router.py`.
- Shared infrastructure lives in `./backend/app/core/`.
- API router aggregation lives in `./backend/app/api/`.

## Backend Direction

The backend Python package name is `app`. The backend is async-first,
domain-oriented, and built on FastAPI, Pydantic v2, SQLAlchemy 2.0 async APIs,
and Alembic.

Main application directories:

```text
backend/app/
├── main.py
├── api/
│   └── main.py
├── commands/
│   ├── export_openapi.py
│   ├── initial_data.py
│   └── wait_for_db.py
├── core/
│   ├── config.py
│   ├── database.py
│   ├── email.py
│   ├── exceptions.py
│   ├── models.py
│   ├── pagination.py
│   └── security.py
└── modules/
    ├── auth/
    ├── users/
    └── system/
```

Architecture summary:

- Put business domains under `backend/app/modules`.
- Put cross-cutting infrastructure under `backend/app/core`.
- Keep `auth` independent from `users`.
- Keep SQLAlchemy ORM models and Pydantic schemas separate.
- Put shared ORM mixins in `backend/app/core/models.py`.
- Put business table models in `backend/app/modules/{domain}/models.py`.
- Use SQLAlchemy 2.0 async APIs for persistence code.
- Pass an explicit actor id into write services for user audit fields where available.
- Do not add new backend logic to the old SQLModel, centralized `crud.py`, or `app/api/routes` layout.

## API Conventions

- Keep `/api/v1` as the versioned API prefix.
- Prefer RESTful names for new endpoints.
- Preserve compatible auth endpoints where practical.
- Use explicit `response_model` declarations.
- Set success status codes explicitly for create, update, and delete operations.
- Business errors should include a stable `detail` and `code`.
- Keep FastAPI and Pydantic's default 422 validation response for request validation errors.

Example business error shape:

```json
{
  "detail": "User not found",
  "code": "USER_NOT_FOUND"
}
```

## Database Conventions

The backend uses SQLAlchemy 2.0 async ORM with Alembic migrations.

- Use plural `snake_case` table names, such as `users` and `password_reset_tokens`.
- Use `snake_case` column names.
- Use `_at` for datetime columns.
- Use `_date` for date columns.
- Use consistent foreign key column names for the same relationship.
- Use explicit SQLAlchemy metadata naming conventions for indexes and constraints.
- Alembic autogeneration should use the shared SQLAlchemy metadata.
- Prefer SQL-first transformations for joins, aggregation, filtering, and sorting.

The async rewrite regenerated the initial Alembic baseline. For future schema
changes, prefer normal incremental migrations.

## Migrations

Alembic is configured to use SQLAlchemy metadata from
`./backend/app/core/database.py`.

After changing a model, generate a revision on the host from the repository
root, with the PostgreSQL instance configured in `.env` running:

```bash
make migration MSG="Add column last_name to User model"
```

Review the generated file under `backend/app/alembic/versions/`, then apply it
using the local backend environment:

```bash
make migrate
```

Alternatively, use `make migrate-docker` to apply migrations in the running
backend container. First let Compose Watch synchronize the revision, or rebuild
and recreate the container so it contains the new file. Watch copies changes
from the host into the container only; revisions generated inside the container
do not automatically appear in your working tree.

Do not use `metadata.create_all()` as the application migration strategy. Use
Alembic for schema changes and commit generated revision files.

## Backend Tests

Run backend tests on the host from the repository root, with dependencies
installed and the configured PostgreSQL instance running:

```bash
make test-backend
# Stop on the first failure:
make test-backend ARGS="-x"
```

The tests run with Pytest. Modify and add tests under `./backend/tests/`.
Pytest uses `TEST_SQLALCHEMY_DATABASE_URI`, built from `POSTGRES_TEST_DB` or
`{POSTGRES_DB}_test` by default. The test fixture refuses to reset a database
whose name does not contain `test`.

Backend tests use:

- `pytest-asyncio`
- `httpx.AsyncClient`
- `ASGITransport`
- async SQLAlchemy session fixtures
- real database or isolated-schema integration tests
- FastAPI `dependency_overrides` for auth and external services

The backend image does not include `backend/tests` or all root configuration
files required by the test suite. Use the host test command even when PostgreSQL
runs in Docker. Extra arguments passed through `ARGS` are forwarded to pytest.

Coverage is saved to `backend/htmlcov/index.html`. Open it in your browser to
inspect coverage.

## Docker Compose Override

During development, you can change Docker Compose settings that affect only the
local development environment in `compose.override.yml`.

While `docker compose watch` is running, host backend code changes are
synchronized into `/app/backend` in the container. A plain `docker compose up`
does not enable this synchronization. Changes to `backend/pyproject.toml`
trigger an image rebuild.

The local override runs `fastapi run --reload` instead of the production command.
It starts a single server process and reloads whenever code changes. If a syntax
error stops the process, fix the error and restart the stack:

```console
$ docker compose watch
```

There is also a commented-out `command` override that keeps the backend container
alive without starting the app. You can use it to enter the container and start a
live reload server manually:

```console
$ fastapi run --reload app/main.py
```

## VS Code

The repository includes a VS Code launch configuration for backend debugging.
Select the repository root `.venv/bin/python` interpreter. To use test discovery,
configure pytest for the `backend/tests` directory through VS Code's Python
testing setup.

## Email Templates

The email templates are in `./backend/app/email-templates/`.

- `src` contains MJML source files.
- `build` contains the final HTML templates used by the application.

Install the [MJML extension](https://github.com/mjmlio/vscode-mjml) in VS Code.
After creating or editing a `.mjml` file in `src`, run `MJML: Export to HTML`
from the command palette and save the generated `.html` file in `build`.

## AI And Development Rules

[AGENTS.md](./AGENTS.md) remains the source of truth for backend architecture
rules. As a practical summary:

- Put new business modules under `backend/app/modules`.
- Keep auth token logic in `backend/app/modules/auth`.
- Keep user persistence and user management in `backend/app/modules/users`.
- Do not create new SQLModel table models.
- Do not combine ORM models and Pydantic schemas.
- Do not call sync database code inside `async def`.
- Use PyJWT for JWT handling.
- Use ruff for Python linting and formatting.
