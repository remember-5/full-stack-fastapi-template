# Repository Guidelines

## Project Structure & Module Organization

This repository is a full-stack FastAPI template with separate backend and frontend workspaces. Backend source lives in `backend/app`, with domains under `backend/app/modules`, shared infrastructure under `backend/app/core`, API aggregation in `backend/app/api`, Alembic migrations in `backend/app/alembic`, and tests in `backend/tests`. Frontend source lives in `frontend/src`, with routes in `frontend/src/routes`, UI in `frontend/src/components`, features in `frontend/src/features`, generated API client code in `frontend/src/client`, assets in `frontend/public`, and Playwright tests in `frontend/tests`. Read `backend/AGENTS.md` and `frontend/AGENTS.md` before changing those areas.

Root-level guidance applies to the whole repository. Backend-specific rules in `backend/AGENTS.md` take precedence for files under `backend/`; frontend-specific rules in `frontend/AGENTS.md` take precedence for files under `frontend/`.

## Build, Test, and Development Commands

- `docker compose up -d`: start the full stack.
- `bash ./scripts/test.sh`: rebuild containers, run backend tests in Docker, then clean up.
- `bash ./scripts/check.sh`: run backend lint, backend tests, frontend lint, and OpenAPI schema consistency checks without rewriting files.
- `bash ./scripts/format.sh`: auto-format backend and frontend code.
- `cd backend && sh scripts/lint.sh`: run `mypy`, `ty`, `ruff check`, and `ruff format --check` for backend application code.
- `cd backend && sh scripts/test.sh`: run `pytest` with coverage reports.
- `bun run dev`: start the frontend Vite dev server from the root workspace.
- `bun run lint` / `bun run test`: run frontend Biome checks or Playwright tests.
- `bash ./scripts/check-openapi.sh`: verify `frontend/openapi.json` is in sync with the backend schema.
- `bash ./scripts/generate-client.sh`: regenerate `frontend/src/client` after backend API schema changes.

## Coding Style & Naming Conventions

Backend code uses Python 3.13+, strict typing, Ruff formatting, and async-first FastAPI patterns. Use `snake_case` for modules, functions, variables, and database table names; use `PascalCase` for Pydantic schemas and SQLAlchemy models. Keep Pydantic schemas separate from ORM models.

Frontend code uses TypeScript, React function components, TanStack Router, TanStack Query, Tailwind CSS, shadcn/ui, Radix UI, and Biome. Use generated client types instead of duplicating API contracts.

Do not hand-edit generated frontend files under `frontend/src/client/**` or `frontend/src/routeTree.gen.ts`. Update the backend schema or frontend route files, then regenerate the affected files with the documented generator.

## Testing Guidelines

Backend tests use `pytest`, `pytest-asyncio`, and coverage. Name tests `test_*.py` and mirror the target area, such as `backend/tests/api/test_login.py`. Frontend tests use Playwright with `*.spec.ts` files in `frontend/tests`. Add or update tests for auth, routing, API contracts, migrations, and user-visible workflows.

## Commit & Pull Request Guidelines

Recent history uses conventional-style prefixes such as `chore:`, `docs:`, and `refactor:`. Keep commits focused and imperative, for example `docs: add contributor guide` or `chore(deps): update docker image version`. Pull requests should include a concise description, linked issue when applicable, test commands run, screenshots for UI changes, and notes for migrations or generated client updates.

## Security & Configuration Tips

Use `.env.example` as the template for local settings and do not commit secrets from `.env`. Keep authentication behavior compatible across backend and frontend unless the change explicitly redesigns it.
