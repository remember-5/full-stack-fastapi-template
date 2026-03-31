# AGENTS.md

Agent guidance for working in `full-stack-fastapi-template`.

## Purpose

- Prefer small, targeted changes that fit the existing backend/frontend split.
- Verify with the narrowest useful command before running broader checks.
- Preserve existing architecture and generated-code boundaries.

## Repository Layout

- `backend/`: FastAPI app, SQLModel models, services, repositories, middleware, pytest suite.
- `frontend/`: React 19 + TypeScript + Vite app with TanStack Router/Query and Playwright tests.
- `scripts/`: top-level Docker-backed helpers and frontend client generation.
- `backend/scripts/`: backend-local lint, format, and test helpers.
- `frontend/src/client/`: generated OpenAPI client. Do not hand-edit.
- `frontend/src/routeTree.gen.ts`: generated TanStack route tree. Do not hand-edit.

## Rule Files

- No `.cursor/rules/` directory was found.
- No `.cursorrules` file was found.
- No `.github/copilot-instructions.md` file was found.
- If any of those files are added later, merge their repo-specific rules into this file.

## Tooling

- Python package management: `uv`
- Python version: `>=3.10,<4.0`
- Backend linting/formatting: `ruff`
- Backend type checking: `mypy --strict`
- Backend testing: `pytest` with `coverage`
- Frontend package manager/runtime: `bun`
- Frontend formatting/linting: `biome`
- Frontend build: `tsc -p tsconfig.build.json && vite build`
- Frontend E2E testing: `playwright`
- Full-stack local environment: `docker compose`

## Setup

### Root

- Install frontend dependencies: `bun install`
- Root scripts proxy to the frontend workspace.

### Backend

- Install dependencies: `cd backend && uv sync`
- Activate virtualenv if needed: `cd backend && source .venv/bin/activate`
- Use `backend/.venv/bin/python` as the interpreter.

### Frontend

- Start local dev server: `cd frontend && bun run dev`
- Set `VITE_API_URL` when pointing the frontend at a non-default API.

## Development Commands

### Docker Compose

- Start full stack: `docker compose up -d`
- Start with live reload workflow: `docker compose watch`
- Start backend dependency stack for Playwright: `docker compose up -d --wait backend`
- Stop and remove volumes: `docker compose down -v`
- View logs: `docker compose logs` or `docker compose logs backend`

### Backend Validation

- Lint/type/format-check bundle: `cd backend && bash scripts/lint.sh`
- Auto-fix backend style: `cd backend && bash scripts/format.sh`
- Full backend suite: `cd backend && bash scripts/test.sh`
- Full Docker-backed suite from repo root: `bash ./scripts/test.sh`

### Backend Single Test

- One test file locally: `cd backend && coverage run -m pytest tests/api/routes/test_users.py`
- One test function locally: `cd backend && coverage run -m pytest tests/api/routes/test_users.py::test_get_users_superuser_me`
- One test file in running container: `docker compose exec backend bash scripts/tests-start.sh tests/api/routes/test_users.py`
- One test function in running container: `docker compose exec backend bash scripts/tests-start.sh tests/api/routes/test_users.py::test_get_users_superuser_me`
- Stop on first backend failure in container: `docker compose exec backend bash scripts/tests-start.sh -x`

### Frontend Validation

- Lint/format frontend from root: `bun run lint`
- Lint/format frontend from workspace: `cd frontend && bun run lint`
- Frontend build: `cd frontend && bun run build`
- Full Playwright suite from root: `bun run test`
- Full Playwright suite from workspace: `cd frontend && bun run test`

### Frontend Single Test

- One Playwright file: `cd frontend && bunx playwright test tests/example.spec.ts`
- One Playwright test by name: `cd frontend && bunx playwright test -g "login"`
- Playwright UI mode: `cd frontend && bunx playwright test --ui`

### Client Generation

- Preferred: `bash ./scripts/generate-client.sh`
- Frontend-only form: `cd frontend && bun run generate-client`
- Regenerate after backend OpenAPI changes.

## Architecture Notes

- Backend generally follows `router -> service -> repository` by feature.
- Keep route handlers thin; move business logic out of routers.
- Frontend uses file-based TanStack Router routes under `frontend/src/routes/`.
- API interaction should stay in generated client calls and React Query hooks/mutations.
- Reuse shared UI primitives before creating new abstractions.

## Backend Style Guidelines

- Use explicit type annotations throughout; `mypy` is strict.
- Prefer `uuid.UUID`, SQLModel models, and existing schema classes already used nearby.
- Keep imports grouped and sorted by Ruff/isort defaults.
- Use concise docstrings only when they add real information.
- Prefer `HTTPException` for expected request/domain failures with stable status codes and clear `detail` values.
- Let middleware handle unexpected server errors instead of broad ad hoc catches.
- Avoid `print`; Ruff forbids it.
- Reuse shared primitives such as `Message`, `PaginatedResponse`, `SessionDep`, and current-user deps.
- When mutating SQLModel instances, `commit()` and `refresh()` when the caller needs the updated object.
- Keep authorization checks aligned with nearby routes, especially around sensitive resources.
- Do not make Alembic changes unless the task really requires a schema change.

## Frontend Style Guidelines

- Keep code compatible with TypeScript `strict` mode.
- Prefer `@/` path aliases for app code imports.
- Follow Biome defaults in this repo: spaces, double quotes, minimal semicolons.
- Let Biome organize imports rather than hand-tuning ordering.
- Prefer functional React components and existing hook patterns.
- Use `zod` and `react-hook-form` for forms when matching current flows.
- Handle async failures through existing helpers such as `handleError` and toast utilities.
- Avoid parameter reassignment; Biome treats it as an error.
- Use self-closing JSX elements where applicable.
- Avoid broad rewrites of `frontend/src/components/ui/`; it is mostly library-style code.
- Avoid `any` unless truly necessary, even though Biome permits it.

## Naming Conventions

- Python classes: `PascalCase`
- Python functions, variables, and modules: `snake_case`
- React components: `PascalCase`
- Hooks: `useX`
- Keep route file names aligned with current TanStack Router naming patterns, including `_layout` segments.
- Match nearby naming instead of renaming for personal preference.

## Error Handling

- Backend: raise `HTTPException` for expected failures and return typed response models when schemas already exist.
- Backend: preserve middleware-based logging and 500 shaping for unexpected exceptions.
- Frontend: preserve existing auth failure behavior that clears tokens and redirects on `401/403`.
- Frontend: show API failures through shared toast/error helpers where possible.

## Testing Expectations

- Run the smallest relevant test first.
- For backend logic changes, start with a targeted pytest invocation before the full suite.
- For frontend UI changes, start with the narrowest Playwright file or `-g` match.
- If API contracts change, run both backend and frontend checks that cover that contract.
- If you regenerate the frontend client, review generated diffs separately from handwritten changes.

## Change Safety

- Do not hand-edit generated files unless the task explicitly requires it.
- Do not silently change tooling or scripts unless the task is about build/dev workflow.
- Never commit real secrets; `.env` values in docs are placeholders.
- If models or schema change, generate and commit the matching Alembic revision.
- Prefer minimal diffs that preserve current architecture and conventions.
