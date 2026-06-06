# Project Rules for AI Agents

This file is the machine-readable working guide for AI coding agents in this repository.
It adapts the structure of
[`zhanymkanov/fastapi-best-practices`](https://github.com/zhanymkanov/fastapi-best-practices)
for this project.

The backend has been refactored away from the original Full Stack FastAPI Template
SQLModel layout. Do not reintroduce the removed centralized model, CRUD, or route
structure.

## Project Direction

- Keep the backend Python package named `app`.
- Target an async-first FastAPI backend.
- Use SQLAlchemy 2.0 async ORM and Pydantic v2 schemas separately.
- Put business domains under `backend/app/modules`.
- Keep cross-cutting infrastructure under `backend/app/core`.
- Keep API router aggregation under `backend/app/api`.
- Keep `auth` independent from `users`.
- Preserve compatible auth endpoints where practical.
- Use plural `snake_case` database table names.
- Future schema changes should use incremental Alembic migrations.

## Compatibility Matrix

Target these versions or newer.

| Dependency | Minimum | Notes |
|---|---:|---|
| Python | 3.13 | Prefer modern typing and Python 3.13+ syntax. |
| FastAPI | 0.115 | Use `Annotated[T, Depends(...)]` for dependencies. |
| Pydantic | 2.7 | Use v2 APIs; avoid `.dict()` and deprecated `json_encoders`. |
| pydantic-settings | 2.4 | Settings live outside Pydantic core. |
| SQLAlchemy | 2.0 | Use `AsyncSession`, `async_sessionmaker`, and `create_async_engine`. |
| Alembic | 1.13 | Use shared SQLAlchemy metadata and async-aware configuration. |
| httpx | 0.27 | Use `AsyncClient` and `ASGITransport` for in-process API tests. |
| PyJWT | 2.9 | Use `import jwt`; do not introduce `python-jose`. |
| pytest-asyncio | 0.23 | Backend tests should support async fixtures and test functions. |
| ruff | 0.6 | Lint and format Python code with ruff. |

## Target Project Structure

Organize backend code by domain, not by file type.

```text
backend/app/
├── main.py
├── api/
│   └── main.py              # router aggregation
├── commands/
│   ├── initial_data.py      # initial data seeding command
│   └── wait_for_db.py       # DB readiness command
├── core/
│   ├── config.py            # global settings
│   ├── database.py          # async engine, session factory, metadata
│   ├── exceptions.py        # global exception base + handlers
│   ├── models.py            # shared ORM mixins and abstract model helpers
│   ├── pagination.py        # shared pagination helpers
│   └── security.py          # password hashing, token helpers
└── modules/
    ├── auth/
    │   ├── router.py
    │   ├── schemas.py
    │   ├── service.py
    │   ├── dependencies.py
    │   ├── constants.py
    │   ├── exceptions.py
    │   └── utils.py
    ├── users/
    │   ├── router.py
    │   ├── schemas.py       # Pydantic request/response schemas
    │   ├── models.py        # SQLAlchemy ORM models
    │   ├── service.py
    │   ├── dependencies.py
    │   ├── constants.py
    │   ├── exceptions.py
    │   └── utils.py
    └── system/
        ├── router.py        # health checks and operational utilities
        └── schemas.py       # system response schemas
```

### Removed Legacy Structure

Do not recreate these removed template-era files or directories:

- `backend/app/models.py`
- `backend/app/crud.py`
- `backend/app/api/routes/*`

Put behavior into `backend/app/modules/*`.

### Cross-Domain Imports

Use explicit module imports. Avoid deep imports that couple domains to internal files.

```python
# Good
from app.modules.auth import service as auth_service
from app.modules.users import constants as users_constants

# Avoid
from app.modules.auth.service.tokens import decode_access_token
```

## Async Routes

### Decision Rule

| Route does this | Use |
|---|---|
| Awaitable non-blocking I/O | `async def` |
| Blocking I/O with no async client | `def` route or `run_in_threadpool` |
| Mix of awaitable and blocking work | `async def` plus `run_in_threadpool` for the blocking part |
| CPU-heavy work | Worker process or real task queue |

### Do / Don't

```python
# DON'T: blocks the event loop.
@router.get("/bad")
async def bad() -> dict[str, bool]:
    time.sleep(10)
    return {"ok": True}

# DO: await non-blocking work.
@router.get("/good")
async def good() -> dict[str, bool]:
    await asyncio.sleep(10)
    return {"ok": True}

# DO: isolate unavoidable sync libraries.
@router.get("/wrapped")
async def wrapped() -> dict[str, object]:
    data = await run_in_threadpool(sync_client.fetch)
    return {"data": data}
```

Rules:

- Do not use sync SQLAlchemy sessions inside `async def`.
- Do not call `requests`, sync SMTP clients, sync filesystem operations, or other blocking SDKs directly inside `async def`.
- Do not use sync routes as the default pattern after the async migration.
- Keep CPU-heavy work out of request handlers.

## Pydantic

- Use Pydantic for API schemas, validation, and serialization.
- Keep Pydantic schemas separate from SQLAlchemy ORM models.
- Use `model_dump()` instead of `.dict()`.
- Use `model_validate()` or explicit constructors instead of v1 parsing APIs.
- Use built-in constraints such as `EmailStr`, `AnyUrl`, `Field(min_length=...)`, and enums.
- Do not place business checks that need database or external state in Pydantic validators.
- Avoid raising `ValueError` in request schemas for business rules; use dependencies or services.

```python
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)
```

## Settings

- Keep global settings in `app/core/config.py`.
- Add domain settings only when a module has enough independent configuration to justify it.
- Use `pydantic-settings`.
- Do not make every module read every environment variable.

## Dependencies

### Use `Annotated`

```python
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

SessionDep = Annotated[AsyncSession, Depends(get_session)]
```

### Validate In Dependencies

Dependencies are for request-scoped validation and authorization composition.

```python
async def valid_user_id(user_id: UUID, session: SessionDep) -> User:
    user = await users_service.get_by_id(session, user_id)
    if user is None:
        raise UserNotFound()
    return user
```

Rules:

- Prefer small chainable dependencies.
- Dependencies are cached per request by default.
- Keep repeated ownership, existence, and permission checks in dependencies.
- Use FastAPI `dependency_overrides` in tests instead of monkeypatching internals where practical.

## Authentication

- Keep authentication in `app/modules/auth`.
- Keep user persistence and user management in `app/modules/users`.
- Use PyJWT: `import jwt`.
- Do not introduce `python-jose`.
- Token parsing, token creation, login, and password reset logic belong to auth.
- User profile and user administration logic belong to users.
- Preserve existing auth endpoint compatibility where practical, especially login token flows used by the frontend.

## Database — SQLAlchemy 2.0 Async

Use SQLAlchemy 2.0 async APIs for new backend persistence work.

```python
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

engine = create_async_engine(str(settings.SQLALCHEMY_DATABASE_URI), pool_pre_ping=True)
SessionFactory = async_sessionmaker(engine, expire_on_commit=False)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with SessionFactory() as session:
        yield session
```

Rules:

- Use `AsyncSession` in services and dependencies.
- Treat `get_session` as the transaction boundary for request-scoped work: services should `flush` or `refresh` when they need database state, and let the session dependency, command, or test fixture handle `commit` and `rollback`.
- Do not create new SQLModel models.
- Do not mix SQLModel table models with new SQLAlchemy ORM models.
- Keep Pydantic schema classes in `schemas.py`.
- Keep ORM classes in `models.py`.
- Keep business table models in `app/modules/{domain}/models.py`.
- Use `app/core/models.py` only for shared abstract ORM mixins and helpers.
- Pass explicit `actor_id` into services that write user-audited models.
- Let `TimestampMixin.updated_at` update through SQLAlchemy `onupdate`; do not set it by hand in routers.
- Prefer SQL-first transformations for joins, aggregation, filtering, and sorting.

### Naming Conventions

- Tables use plural `snake_case`: `users`, `password_reset_tokens`, `audit_logs`.
- Columns use `snake_case`.
- Datetime columns end in `_at`.
- Date columns end in `_date`.
- Use the same foreign key column name everywhere it represents the same relationship.
- Define SQLAlchemy metadata naming conventions for indexes and constraints.

```python
from sqlalchemy import MetaData

POSTGRES_NAMING_CONVENTION = {
    "ix": "%(column_0_label)s_idx",
    "uq": "%(table_name)s_%(column_0_name)s_key",
    "ck": "%(table_name)s_%(constraint_name)s_check",
    "fk": "%(table_name)s_%(column_0_name)s_fkey",
    "pk": "%(table_name)s_pkey",
}

metadata = MetaData(naming_convention=POSTGRES_NAMING_CONVENTION)
```

## Migrations — Alembic

- Alembic autogeneration must use the shared SQLAlchemy metadata.
- Migrations must be static and reversible unless explicitly documented otherwise.
- Prefer incremental migrations for new schema changes.
- Do not use `metadata.create_all()` as the application migration strategy.

## Background Work

| Use `BackgroundTasks` when | Use Celery / Arq / RQ when |
|---|---|
| The task is short and non-critical | The task needs retries or durability |
| Silent loss is acceptable | Operators need visibility |
| It can run in the web worker process | It is CPU-heavy or long-running |
| No scheduling is needed | Scheduling, rate limits, or ETA are needed |

Do not put work in `BackgroundTasks` if losing it would page someone.

## Error Handling

- Use project exceptions for business errors.
- Define module-specific exceptions in `app/modules/{domain}/exceptions.py`.
- Define module error codes in `app/modules/{domain}/constants.py`.
- Convert project exceptions to JSON with a global handler.
- Business error responses should include `detail` and `code`.
- Keep FastAPI/Pydantic default 422 validation responses.

```json
{
  "detail": "User not found",
  "code": "USER_NOT_FOUND"
}
```

## API Documentation

- Keep `response_model` explicit on endpoints.
- Set success status codes explicitly for create/delete/update operations.
- Document expected business error responses where useful.
- Keep `/api/v1` as the versioned API prefix.
- Prefer RESTful endpoint names for new APIs.
- Do not remove existing auth compatibility routes without a frontend migration plan.

## Testing

Backend tests should move to async as part of the backend rewrite.

```python
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client() -> AsyncClient:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
```

Rules:

- Use `pytest-asyncio` for async tests.
- Use `httpx.AsyncClient` with `ASGITransport`.
- Use async SQLAlchemy fixtures for database tests.
- Prefer a real test database or isolated schema for integration tests.
- Cover API, dependency, and service behavior.
- Keep tests runnable at each migration phase.

## Change Checklists

When adding or changing a backend domain, update the matching set of files as needed:

- `models.py`
- `schemas.py`
- `service.py`
- `router.py`
- `dependencies.py`
- `exceptions.py`
- `constants.py`
- tests under `backend/tests/`
- Alembic migration if schema changed
- API aggregation in `backend/app/api/main.py` if a new router is introduced

When adding a backend command or shared helper, place it under `backend/app/commands` or `backend/app/core` only when it is genuinely cross-domain.

## Linting And Formatting

- Use ruff for Python linting and formatting.
- Existing project commands may wrap ruff; prefer local scripts when available.

```shell
ruff check --fix backend/app backend/tests
ruff format backend/app backend/tests
```

## Anti-Patterns

| Anti-pattern | Why it is wrong | Fix |
|---|---|---|
| Adding new code to `app/crud.py` | Continues the legacy file-type structure. | Put behavior in `app/modules/{domain}/service.py`. |
| Creating new SQLModel models | Conflicts with the target SQLAlchemy async ORM. | Create SQLAlchemy ORM models in module `models.py`. |
| Combining ORM models and Pydantic schemas | Blurs persistence and API boundaries. | Use `models.py` for ORM and `schemas.py` for Pydantic. |
| Calling sync DB code inside `async def` | Blocks the event loop and can exhaust pools. | Use `AsyncSession`. |
| Using `requests` inside `async def` | Blocks the event loop. | Use `httpx.AsyncClient` or `run_in_threadpool`. |
| Using `python-jose` | It is not the target JWT library. | Use PyJWT. |
| Mocking internals in integration tests | Diverges from production behavior. | Use dependency overrides and real DB fixtures. |
| Putting auth token logic in users | Couples separate domains. | Keep token logic in `app/modules/auth`. |
| Creating modules outside `app/modules` | Makes boundaries inconsistent. | Place business domains under `app/modules/{domain}`. |
| Treating README as migration proof | Documentation describes direction, not completed code. | Verify implementation and tests. |

## Quick Reference

| Scenario | Solution |
|---|---|
| New business feature | Add or extend `app/modules/{domain}`. |
| API route | `router.py` with explicit `response_model`. |
| Business logic or queries | `service.py` with `AsyncSession`. |
| Request validation against DB | Chainable dependency in `dependencies.py`. |
| Request/response schema | Pydantic model in `schemas.py`. |
| Database table | SQLAlchemy ORM class in `models.py`. |
| Business error | Module exception + error code. |
| JWT handling | `app/modules/auth` using PyJWT. |
| Async DB | SQLAlchemy 2.0 async. |
| HTTP API test client | `httpx.AsyncClient` + `ASGITransport`. |
| Override auth or external dependency in tests | `app.dependency_overrides`. |
| Lint and format | `ruff check --fix` + `ruff format`. |
