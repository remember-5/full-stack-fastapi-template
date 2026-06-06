# Frontend Rules for AI Agents

This file is the machine-readable working guide for AI coding agents in the
frontend workspace. It complements the repository-level docs and should be read
before editing files under `frontend/`.

## Frontend Direction

- Keep the frontend as a Vite, React, TypeScript application.
- Use TanStack Router for routing and TanStack Query for server state.
- Use the generated OpenAPI client in `src/client` for backend API calls.
- Use Tailwind CSS, shadcn/ui, and Radix UI for UI implementation.
- Use React Hook Form and Zod for non-trivial form state and validation.
- Use Biome for frontend linting and formatting.
- Use Playwright for end-to-end coverage of user-visible workflows.
- Keep the authenticated application layout sidebar-based and work-focused.
- Prefer small feature modules and reusable controls over large route files.
- Preserve compatibility with the backend authentication flows unless explicitly
  requested otherwise.

## Compatibility Matrix

Target these versions or newer when changing frontend code.

| Dependency | Minimum | Notes |
|---|---:|---|
| Bun | Current lockfile | Prefer Bun commands because the workspace uses `bun.lock`. |
| Node.js | 20 | Keep code compatible with modern Vite tooling. |
| TypeScript | 5.9 | Keep `strict` mode clean. |
| React | 19 | Use function components and hooks. |
| Vite | 7 | Keep browser-only code out of build-time config. |
| TanStack Router | 1.160 | Use file routes under `src/routes`. |
| TanStack Query | 5 | Use query keys, mutations, and invalidation intentionally. |
| Tailwind CSS | 4 | Use the tokenized theme in `src/index.css`. |
| shadcn/ui | 4.11 | Compose generated primitives instead of hand-rolling basics. |
| Radix UI | 1.5 | Use the official `radix-ui` package instead of individual `@radix-ui/react-*` packages. |
| @hey-api/openapi-ts | 0.98.2 | Generate the client from `frontend/openapi-ts.config.ts`; do not hand-edit generated output. |
| Playwright | 1.60 | Add E2E tests for important user flows. |
| Biome | 2 | Do not introduce ESLint or Prettier for frontend formatting. |

## Project Structure

Keep code organized by UI responsibility.

```text
frontend/
├── src/
│   ├── client/              # generated OpenAPI client; do not hand-edit
│   ├── components/
│   │   ├── ui/              # shadcn/Radix primitives and low-level UI
│   │   ├── controls/        # reusable app controls
│   │   ├── app-shell/       # authenticated layout and navigation
│   │   └── common/          # shared app-level components
│   ├── features/            # feature-level screens, dialogs, tables, forms
│   ├── hooks/               # reusable React hooks
│   ├── lib/                 # shared utilities and API error helpers
│   ├── routes/              # TanStack file routes
│   ├── main.tsx             # providers, router, OpenAPI config
│   ├── routeTree.gen.ts     # generated router tree; do not hand-edit
│   └── index.css            # Tailwind imports and design tokens
├── tests/                   # Playwright tests and helpers
├── openapi-ts.config.ts     # OpenAPI client generator config
├── package.json             # frontend commands
└── README.md                # human-facing frontend docs
```

Rules:

- Put route declarations in `src/routes`.
- Put reusable domain UI in `src/features/<domain>`.
- Put shell/navigation UI in `src/components/app-shell`.
- Put design-system primitives in `src/components/ui`.
- Put generic hooks in `src/hooks`.
- Put shared pure utilities and cross-feature helpers in `src/lib`.
- Do not move generated files into feature folders.
- Put feature-specific components in `features/<domain>` rather than
  `components`.
- Do not add new top-level source folders unless the existing boundaries are
  clearly insufficient.

## Commands

Run commands from `frontend/` unless a root script is explicitly needed.

```bash
bun install
bun run dev
bun run build
bun run lint
bun run generate-client
bun run test
bun run test:ui
```

Root workspace scripts forward common frontend commands:

```bash
bun run dev
bun run lint
bun run test
bun run test:ui
```

Before finishing a frontend change:

- Run `bun run lint` for formatting and static checks.
- Run `bun run build` when TypeScript, routes, imports, or build config changed.
- Run relevant Playwright tests when authentication, routing, settings, admin,
  or form workflows changed.
- If backend API schemas changed, regenerate the client with
  `bash ./scripts/generate-client.sh` from the repository root.

## Generated Files

Do not hand-edit generated files:

- `src/client/**`
- `src/routeTree.gen.ts`

For API changes:

1. Update the backend OpenAPI schema source.
2. Regenerate the frontend client.
3. Update frontend call sites to use generated service methods and types.
4. Commit generated changes with the code that depends on them.

For route changes:

- Add or edit files under `src/routes`.
- Let TanStack Router tooling update `src/routeTree.gen.ts`.
- Do not patch the generated route tree manually.

## Routing

- Use TanStack Router file routes.
- Keep route files thin. They should declare route behavior, guards, and page
  composition.
- Move substantial UI, table, dialog, and form logic into `src/features`.
- Protect authenticated pages through `_layout` or explicit route guards.
- Use `redirect` from `@tanstack/react-router` for navigation decisions in
  `beforeLoad`.
- Use route-level error and not-found behavior consistently with
  `src/routes/__root.tsx`.

Rules:

- Do not introduce React Router.
- Do not use ad hoc `window.location` navigation except for global auth recovery
  where the app already does so.
- Do not put long business workflows directly in route modules.

## Data Fetching and API Client

- Use services and types exported from `@/client`.
- Use TanStack Query for server state.
- Keep API base URL and token configuration centralized in `src/main.tsx`.
- Use stable query keys that reflect the resource being fetched.
- Invalidate related query keys after successful mutations.
- Use existing API error handling helpers such as `handleApiError` and
  `useCustomToast` where appropriate.

Example patterns:

```ts
const { data } = useQuery({
  queryKey: ["users"],
  queryFn: UsersService.readUsers,
})
```

```ts
const mutation = useMutation({
  mutationFn: (data: UserCreate) =>
    UsersService.createUser({ requestBody: data }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["users"] })
  },
})
```

Rules:

- Do not call `fetch` or `axios` directly for backend endpoints already covered
  by the generated client.
- Do not duplicate generated API types by hand.
- Do not store server state in local React state when TanStack Query is the
  natural owner.
- Do not swallow API errors silently.

## Authentication

- Preserve the current bearer token flow unless an auth redesign is requested.
- Read and write the access token through the existing `access_token`
  localStorage key.
- Keep login, signup, logout, and current-user behavior aligned with
  `src/features/auth/auth-controller.ts` and `src/hooks/useAuth.ts`.
- Keep unauthorized API handling aligned with the global Query and Mutation
  cache handlers in `src/main.tsx`.
- Clear stale tokens when the API returns 401 or 403.

Rules:

- Do not introduce a second token storage key.
- Do not add a second auth context unless the existing hook-based flow is being
  intentionally replaced.
- Do not expose tokens in logs, UI text, URLs, or test output.

## Components and UI

- Prefer existing shadcn/ui components before adding new primitives.
- Use Radix primitives for dialogs, menus, selects, tabs, tooltips, sheets, and
  other interactive UI.
- Use `lucide-react` icons for icon buttons and navigation icons when available.
- Keep low-level reusable controls in `src/components/controls`.
- Keep feature-specific components near their feature in `src/features`.
- Keep app shell changes within `src/components/app-shell`.
- Use `@/components/ui/*` imports for UI primitives.
- Name ordinary source files and directories with `kebab-case`, including
  component files such as `password-input.tsx` and `user-menu.tsx`.
- Keep React component exports in `PascalCase`, hooks in `useXxx`, and route
  files under `src/routes` aligned with TanStack Router file-route conventions.

Rules:

- Do not nest UI cards inside other cards.
- Do not create decorative page sections that look like marketing landing pages
  for operational app screens.
- Do not use visible instructional copy to explain obvious UI controls.
- Do not use negative letter spacing.
- Do not scale font size directly with viewport width.
- Do not hand-code custom SVG icons when a suitable `lucide-react` icon exists.
- Do not add new component libraries without a clear project-level decision.

## Forms and Validation

- Use React Hook Form for forms with validation, async submission, or multiple
  fields.
- Use Zod schemas for client-side validation when the form has meaningful rules.
- Use generated API request types from `@/client` for submission payloads.
- Disable or show loading state for submit buttons while mutations are pending.
- Surface validation and API errors near the relevant action.

Rules:

- Do not rely only on placeholders as labels.
- Do not duplicate validation rules across unrelated components when a shared
  schema or helper would be clearer.
- Do not submit forms with stale generated API types after backend schema
  changes.

## State Management

- Use local React state for ephemeral UI state.
- Use TanStack Query for server state, cache invalidation, and request status.
- Use localStorage only for durable browser state that is intentionally
  cross-session, such as the current access token or persisted UI preference.
- Keep global providers in `src/main.tsx` or a small provider component when they
  affect the whole app.

Rules:

- Do not add Redux, Zustand, Jotai, or another state library without a clear
  need.
- Do not mirror query data into separate component state just to render it.

## Styling

- Use Tailwind utility classes and existing CSS variables from `src/index.css`.
- Use `cn`/class merging helpers when composing conditional Tailwind classes if
  available in the local pattern.
- Keep theme tokens in `src/index.css`.
- Support light and dark modes for new UI.
- Maintain compact, scannable layouts for the authenticated app.
- Keep fixed-format UI elements stable with explicit dimensions, grid tracks,
  or aspect ratios where dynamic content could shift layout.

Rules:

- Do not add broad global CSS for a single component.
- Do not hard-code large color systems in components.
- Do not introduce one-off gradients, decorative blobs, or background effects for
  app screens.
- Do not let text overflow buttons, table cells, cards, dialogs, or sidebars.
- Do not use inline styles unless the value is genuinely dynamic and not
  expressible with Tailwind.

## Accessibility

- Prefer Radix and shadcn primitives because they provide accessible behavior.
- Ensure icon-only buttons have accessible labels or tooltips.
- Keep form controls associated with labels.
- Preserve keyboard navigation for dialogs, menus, tabs, tables, and navigation.
- Use semantic elements for page structure where practical.
- Keep loading, empty, and error states understandable without color alone.

## Testing

- Use Playwright for user-visible frontend flows.
- Keep test helpers in `frontend/tests/utils`.
- Prefer role, label, and accessible-name locators over brittle CSS selectors.
- Cover login, signup, password reset, settings, admin, and permission-sensitive
  behavior when those flows change.
- Use API helpers for setup and cleanup when that is clearer than repeating UI
  steps.
- Keep tests deterministic and independent.

Rules:

- Do not depend on test execution order.
- Do not assert implementation details when visible behavior can be asserted.
- Do not leave debug-only waits, `page.pause()`, or console logging in tests.

## Change Checklists

When adding or changing a page, update the matching set of files as needed:

- route file under `src/routes`
- feature component under `src/features/<domain>`
- query keys and mutations for server state
- generated client usage from `src/client`
- loading, empty, error, and permission states
- navigation or app shell entries when the page should be discoverable
- Playwright coverage for important user-visible behavior

When changing a backend API consumed by the frontend:

- regenerate `src/client/**` through `bash ./scripts/generate-client.sh`
- update call sites to use generated service methods and types
- do not hand-edit `src/client/**`

When changing routes:

- update files under `src/routes`
- let TanStack Router tooling update `src/routeTree.gen.ts`
- do not hand-edit `src/routeTree.gen.ts`

## TypeScript

- Keep `strict` TypeScript clean.
- Prefer generated API types and explicit local types for component contracts.
- Use `type` imports when importing types only.
- Use path alias imports from `@/` for source files.
- Keep props small and named by component intent.

Rules:

- Do not use `any` unless narrowing is impossible and the reason is documented
  with a short comment.
- Do not silence TypeScript errors with broad assertions.
- Do not add unused exports or unused route params.

## Do / Don't

Do:

- Follow the existing file and naming patterns.
- Keep route files focused on route concerns.
- Compose UI from existing primitives.
- Use generated client services for backend calls.
- Invalidate queries after successful mutations.
- Add focused tests for changed user workflows.
- Run the smallest command set that proves the change.

Don't:

- Hand-edit `src/client` or `src/routeTree.gen.ts`.
- Introduce a second router, API layer, formatter, or state library.
- Recreate components that already exist in `components/ui` or `controls`.
- Put server state into local component state by default.
- Rebuild auth storage or token handling casually.
- Add broad visual redesigns while implementing narrow behavior changes.
- Leave TODOs, placeholder copy, debug UI, or dead code.

## Definition of Done

A frontend change is done when:

- The implementation follows this file and the local code patterns.
- TypeScript and Biome checks pass, or any inability to run them is reported.
- Build passes for changes that can affect bundling, route generation, imports,
  or type checking.
- Relevant Playwright tests pass for changed workflows, or the remaining test
  gap is clearly reported.
- Generated files are updated only through their generators.
- Auth behavior remains aligned with `src/features/auth/auth-controller.ts` and
  `src/hooks/useAuth.ts`.
- The final response tells the user what changed and which verification commands
  were run.
