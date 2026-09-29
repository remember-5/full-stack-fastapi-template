# FastAPI Project - Frontend

The frontend is built with Vite, React, TypeScript, TanStack Router, TanStack Query, Tailwind CSS, shadcn/ui, Radix UI, and Playwright.

## Requirements

- [Bun](https://bun.sh/) recommended
- [Node.js](https://nodejs.org/) 22.18+ for tools executed with Node, including
  the OpenAPI client generator; repository scripts use Bun.

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
bun run typecheck
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
- `frontend/public` - static assets.
- `frontend/src/client` - generated OpenAPI client.
- `frontend/src/components` - reusable UI components.
- `frontend/src/hooks` - custom hooks.
- `frontend/src/routes` - route modules and pages.
- `frontend/tests` - Playwright end-to-end tests.

## Data Tables

Reusable table controls live in `src/components/controls/data-table/`. `DataTable`
accepts a TanStack Table instance; compose its toolbar with `DataTableToolbar`,
`DataTableSearch`, and `DataTableViewOptions`. Keep business columns, filters, API
calls, and URL state in the feature. The user administration page in
`src/features/users/` is the reference implementation.

The user table supports username/email search, role/status/creation-date filters,
single-column sorting, pagination (10/20/50/100 rows), and column visibility.
Use a column header menu to sort or hide it, and **显示列** to show it again or
restore all default columns. Row actions always remain available. Visibility is
local to the mounted page and resets when the page is reopened.

Search, filters, sorting, and pagination are validated URL parameters, so refresh
and browser history restore them. Typing replaces the current history entry and
API requests are debounced by 300 ms; other table actions add history entries.
Changing a filter, sort, or page size returns to page one. Deleting the last row
on a page moves to the last remaining page.

The users API filters and sorts **before** pagination and returns the filtered
count. Username/email matching is case-insensitive literal substring matching.
Sorting defaults to newest creation time first, uses the user ID as a stable
tiebreaker, and places null names last. Date presets cover local calendar days
(today, or today plus the preceding 6/29 days); the client sends timezone-aware
boundaries to the API as an inclusive start and exclusive end. Generated client
files must be refreshed with `make client` after API changes.

Run the table and existing administration regression tests with:

```bash
bunx playwright test admin.spec.ts user-table.spec.ts
```

## Generate Client

Regenerate the frontend API client whenever backend OpenAPI schema changes are
made.

### Automatically

- From the top-level project directory, run:

```bash
make client
```

- Commit the generated changes.

Use `make check-openapi` from the root to compare the backend schema with the
snapshot without rewriting files. Use `make typecheck` to check frontend types,
or `make check` for the combined repository checks.

### Manually

- Start the Docker Compose stack.
- Download the OpenAPI JSON file from `http://localhost:8000/api/v1/openapi.json`.
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

The frontend includes Playwright **1.62.1** end-to-end tests that run locally
or in the matching Docker image.
Configure the root `.env` using `.env.example`, including the Mailpit settings
in the root README. Start the development services from the repository root:

```bash
make install
make infra
make init-db
make dev-backend
```

In another terminal, install the matching browser from `frontend/` once (and
after each Playwright upgrade):

```bash
bunx playwright install chromium
```

Playwright starts or reuses the local Vite server. The backend and Mailpit must
remain running while tests execute.

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

HTML reports are saved in `playwright-report/`; JUnit results, failure
screenshots, and traces are saved in `test-results/`. Open the report with:

```bash
bunx playwright show-report
```

To run tests in Docker instead, run these commands from the repository root:

```bash
docker compose up -d --build --wait backend mailpit
docker compose run --rm --build playwright
# Run a subset:
docker compose run --rm playwright bunx playwright test reset-password.spec.ts
```

The optional `playwright` service starts Vite inside the test container. It uses
`http://backend:8000` for API requests and `http://mailpit:8025` for email queries.
Reports are mounted into the same directories above. Ordinary `docker compose up`
does not start this service. Stop a host backend before starting the Docker backend
on the same port.

For more information on writing and running Playwright tests, refer to the
[Playwright documentation](https://playwright.dev/docs/intro).

## Removing The Frontend

If you are developing an API-only app and want to remove the frontend:

- Remove the `./frontend` directory.
- In `compose.yml`, remove the `frontend` service.
- In `compose.override.yml`, remove the `frontend` and `playwright` services.

Update the root Bun workspace, lockfile, Makefile targets, and documentation to
remove references to the frontend. Review `FRONTEND_HOST` and email links before
changing them: password recovery emails currently link to the frontend.
