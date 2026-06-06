# FastAPI Project - Frontend

The frontend is built with Vite, React, TypeScript, TanStack Router, TanStack Query, Tailwind CSS, shadcn/ui, Radix UI, and Playwright.

## Requirements

- [Bun](https://bun.sh/) recommended
- [Node.js](https://nodejs.org/) as an alternative runtime for compatible commands

## Quick Start

From `./frontend/`:

```bash
bun install
bun run dev
```

Then open your browser at `http://localhost:5173/`.

The live server is not running inside Docker. It is the recommended local
development workflow because it supports fast reloads without rebuilding the
frontend Docker image.

## Root Workspace Commands

The repository root forwards common frontend commands to the `frontend`
workspace:

```bash
bun run dev
bun run lint
bun run test
bun run test:ui
```

Equivalent frontend-local commands are available in `frontend/package.json`,
including:

```bash
bun run build
bun run preview
bun run generate-client
```

## Frontend Stack

- React and TypeScript for UI code.
- Vite for development and production builds.
- Tailwind CSS for styling.
- shadcn/ui and Radix UI for component primitives.
- TanStack Router for file-based routing.
- TanStack Query for server state and API requests.
- Playwright for end-to-end tests.
- Biome for frontend linting and formatting.
- `@hey-api/openapi-ts` for generated API client code.

## Code Structure

- `frontend/src` - main frontend code.
- `frontend/src/assets` - static assets.
- `frontend/src/client` - generated OpenAPI client.
- `frontend/src/components` - reusable UI components.
- `frontend/src/hooks` - custom hooks.
- `frontend/src/routes` - route modules and pages.
- `frontend/tests` - Playwright end-to-end tests.

## Generate Client

Regenerate the frontend API client whenever backend OpenAPI schema changes are
made.

### Automatically

- Activate the backend virtual environment.
- From the top-level project directory, run:

```bash
bash ./scripts/generate-client.sh
```

- Commit the generated changes.

### Manually

- Start the Docker Compose stack.
- Download the OpenAPI JSON file from `http://localhost/api/v1/openapi.json`.
- Copy it to `frontend/openapi.json`.
- From `./frontend/`, run:

```bash
bun run generate-client
```

- Commit the generated changes.

## Using a Remote API

Set `VITE_API_URL` to the remote API URL. For example, in `frontend/.env`:

```env
VITE_API_URL=https://api.my-domain.example.com
```

When you run the frontend, it will use that URL as the API base URL.

## End-to-End Testing With Playwright

The frontend includes Playwright end-to-end tests. Start the backend stack first:

```bash
docker compose up -d --wait backend
```

Run tests from `./frontend/`:

```bash
bunx playwright test
```

Run tests in UI mode:

```bash
bunx playwright test --ui
```

Or use root workspace scripts:

```bash
bun run test
bun run test:ui
```

To stop and remove the Docker Compose stack and clean test data:

```bash
docker compose down -v
```

For more information on writing and running Playwright tests, refer to the
[Playwright documentation](https://playwright.dev/docs/intro).

## Removing The Frontend

If you are developing an API-only app and want to remove the frontend:

- Remove the `./frontend` directory.
- In `compose.yml`, remove the `frontend` service.
- In `compose.override.yml`, remove the `frontend` and `playwright` services.

You can also remove `FRONTEND` environment variables from `.env` and
`./scripts/*.sh` if you want to clean up unused settings.
