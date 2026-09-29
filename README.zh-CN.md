# FastAPI 全栈项目

[English](./README.md) | **简体中文**

这是一个基于 Full Stack FastAPI Template 的 FastAPI + React 全栈应用。根目录 README 提供项目概览和快速上手说明，日常开发细节请参阅后端和前端各自的 README。

## 技术栈

后端：

- FastAPI
- PostgreSQL
- Pydantic v2
- Alembic
- PyJWT
- SQLAlchemy
- pytest
- uv：Python 依赖管理

前端：

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui 和 Radix UI
- TanStack Router 和 TanStack Query
- Playwright
- Bun：前端脚本运行工具

基础设施：

- Docker Compose：本地开发和部署
- Traefik：反向代理
- Mailpit：本地邮件测试
- Sentry：按需配置的监控集成

## 项目结构

```text
.
├── backend/              # FastAPI 应用、数据库迁移、后端测试
├── frontend/             # React 应用、生成的 API 客户端、端到端测试
├── compose.yml           # 主 Docker Compose 配置
├── compose.override.yml  # 本地开发的 Compose 覆盖配置
├── Makefile              # 在仓库根目录使用的常用开发命令
├── package.json          # Bun 工作区配置及前端命令入口
├── README.md             # 英文文档
└── README.zh-CN.md       # 简体中文文档
```

## 使用 Docker 快速启动

启动前，复制示例环境文件并调整本地配置：

```bash
cp .env.example .env
```

部署前，至少修改以下密钥和密码：

- `SECRET_KEY`
- `FIRST_SUPERUSER_PASSWORD`
- `POSTGRES_PASSWORD`

可以使用以下命令生成密钥：

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

启动本地 Docker Compose 服务：

```bash
docker compose watch
```

服务访问地址：

- API：`http://localhost:8000`
- API 文档：`http://localhost:8000/docs`
- 前端容器：`http://localhost:5173`
- Adminer：`http://localhost:8080`
- Mailpit：`http://localhost:8025`

开发前端时，直接在本机运行 Vite 通常比反复构建前端镜像更快。在另一个终端中，先停止前端容器以释放 5173 端口，再从仓库根目录启动 Vite：

```bash
docker compose stop frontend
bun install
bun run dev
```

前端开发服务器地址为 `http://localhost:5173/`。

## 在本机运行前后端

前后端可以直接在本机运行，但仍需要一个与 `.env` 配置一致的 PostgreSQL 实例。`.env.example` 中的默认配置为：

- `POSTGRES_SERVER=localhost`
- `POSTGRES_PORT=5432`
- `POSTGRES_DB=app`
- `POSTGRES_USER=postgres`
- `POSTGRES_PASSWORD=changethis`

配置好 `.env` 后，在仓库根目录执行以下命令。请先停止已运行的后端或前端容器，确保 8000 和 5173 端口可用：

```bash
make install
make infra
make init-db
make dev-backend
```

在第二个终端中，从仓库根目录启动前端：

```bash
make dev-frontend
```

本地前端默认访问 `http://localhost:8000` 上的 API。如需使用其他地址，请修改 `frontend/.env` 中的 `VITE_API_URL`。

## 生成前端 API 客户端

`frontend/src/client` 中的 API 客户端由后端 OpenAPI Schema 自动生成，请勿手动修改这些文件。

修改后端路由、请求或响应模型、OpenAPI 元数据后，运行：

```bash
make client
```

该命令会：

- 使用后端 Settings 加载 `.env`；仅在 `.env` 不存在时回退到 `.env.example`。已导出的环境变量优先级更高。
- 将当前后端 OpenAPI Schema 导出到 `frontend/openapi.json`。
- 执行前端的 `generate-client` 脚本。

如果只需检查 `frontend/openapi.json` 是否与后端一致，运行：

```bash
make check-openapi
```

检查时比较 JSON 内容，忽略空白和对象键的顺序，不会改写快照。这两个命令共用 `backend/app/commands/export_openapi.py`，写入时通过原子替换更新文件。它们都不需要启动 API 服务或数据库。可以将 `APP_ENV_FILE` 设置为 dotenv 文件的绝对路径，显式指定使用的配置文件。

修改后端 API 时，应一起提交 `frontend/openapi.json` 和重新生成的 `frontend/src/client` 文件。`make check-openapi` 只检查 Schema，不验证生成的 TypeScript 文件。

如果需要同时验证 Schema 和生成的客户端，请在已安装依赖的干净临时检出目录中运行：

```bash
make client
git diff --exit-code -- frontend/openapi.json frontend/src/client
test -z "$(git status --porcelain -- frontend/openapi.json frontend/src/client)"
```

状态检查也会发现新生成但尚未跟踪的文件。由于生成命令会写入文件，请在独立检出目录中执行。`make check` 可以统一运行 lint、类型检查、后端测试和 Schema 一致性检查。

## 本地自动化测试

测试使用本地开发服务。配置 `.env` 后，安装依赖并启动 PostgreSQL 和 Mailpit：

```bash
make install
make infra
make init-db
```

后端测试不需要启动 API 服务：

```bash
make test-backend
# 只运行部分测试：
make test-backend ARGS="-x -k login"
```

运行浏览器测试前，首次使用或升级 Playwright 后，需要安装与 **Playwright 1.62.1** 匹配的浏览器。然后从仓库根目录启动本地后端：

```bash
(cd frontend && bunx playwright install chromium)
make dev-backend
```

在另一个终端中运行：

```bash
make test-frontend
# 只运行密码找回测试：
make test-frontend ARGS="reset-password.spec.ts"
# 或打开交互式测试界面：
make test-ui
```

Playwright 会启动或复用本地 Vite 服务。浏览器测试会在配置的开发数据库中创建和修改用户；后端测试使用下文说明的独立测试数据库。

后端覆盖率报告位于 `backend/htmlcov/`。浏览器测试报告位于 `frontend/playwright-report/` 和 `frontend/test-results/`，包含 JUnit 结果、失败截图和执行追踪。在 `frontend/` 目录运行 `bunx playwright show-report` 可以打开 HTML 报告。

### 在 Docker 中运行 Playwright

如果需要使用 **Playwright 1.62.1** 镜像运行浏览器测试，可以在仓库根目录通过现有开发 Compose 服务执行：

```bash
docker compose up -d --build --wait backend mailpit
docker compose run --rm --build playwright
# 只运行密码找回测试：
docker compose run --rm playwright bunx playwright test reset-password.spec.ts
```

`playwright` 服务配置了 `test` profile，普通的 `docker compose up` 不会启动测试。使用 `docker compose run` 显式指定该服务时会启用它。Playwright 会在容器内启动 Vite，并访问 `http://backend:8000` 和 `http://mailpit:8025`。测试使用配置的开发数据库，报告写入与本机测试相同的宿主机目录。请在本机后端和 Docker 后端之间选择一种运行方式，避免端口冲突。

### 使用 Mailpit 测试本地邮件

`make infra` 会启动 PostgreSQL 和 Mailpit。打开 `http://localhost:8025` 可以查看捕获的邮件。本机运行后端时，请在 `.env` 中配置 `SMTP_HOST=localhost`、`SMTP_PORT=1025`、`SMTP_TLS=False`、`SMTP_SSL=False`，并为浏览器测试配置 `MAILPIT_HOST=http://localhost:8025`。已有的 `.env` 不会自动更新。Docker 后端使用 `SMTP_HOST=mailpit`。

密码找回测试通过测试用户的唯一收件地址查询 Mailpit。Mailpit 用于本地开发和测试，部署环境应配置实际使用的 SMTP 服务。

## 常用命令

在仓库根目录运行 `make` 或 `make help` 可以查看全部快捷命令。Makefile 调用现有脚本，不同命令分别需要 Make、Bash、uv、Bun 或 Docker Compose。

本地开发时，先将 `.env.example` 复制为 `.env` 并按前文完成配置，然后运行：

```bash
make install
make infra
make init-db
make dev-backend
```

在第二个终端运行 `make dev-frontend`。本地开发服务在前台运行。请在本地服务和完整 Docker 服务之间选择一种方式，避免重复占用端口。

| 命令 | 用途 |
|---|---|
| `make up` / `make down` | 启动或移除 Docker 服务；`down` 保留数据卷。 |
| `make watch` | 启动 Docker Compose Watch 模式。 |
| `make ps` / `make logs` | 查看服务状态或持续查看日志。 |
| `make build` / `make restart` | 构建 Docker 镜像或重启服务。 |
| `make shell` | 进入运行中的后端容器 Bash。 |
| `make lint` / `make format` | 检查代码，或格式化并自动修复。 |
| `make check` | 运行 lint、前端类型检查、后端测试和 OpenAPI 一致性检查。 |
| `make typecheck` | 检查前端 TypeScript 类型，不执行构建。 |
| `make test-backend` | 运行后端测试，生成终端及 HTML 覆盖率报告。 |
| `make test-frontend` / `make test-ui` | 运行 Playwright 测试或打开测试界面。 |
| `make build-frontend` | 检查类型并构建前端。 |
| `make client` / `make check-openapi` | 重新生成 API 客户端，或检查 Schema 一致性。 |
| `make migrate` / `make migrate-docker` | 在本机环境或运行中的后端容器内应用迁移。 |
| `make migration MSG="describe change"` | 在本机生成迁移文件，审核并提交。 |
| `make migration-history` | 查看本地 Alembic 迁移历史。 |

可以通过 `SERVICE` 为 `up`、`logs`、`build` 或 `restart` 指定服务，通过 `ARGS` 传递额外测试参数。参数包含多个单词时，在外层引号内使用单引号：

```bash
make logs SERVICE=backend
make restart SERVICE=backend
make test-backend ARGS="-x -k 'login or signup'"
make test-frontend ARGS="--project=chromium"
make migration MSG="add users index"
```

后端测试需要配置好的 PostgreSQL 实例。Playwright 测试需要后端和 Mailpit，前端 Vite 服务由 Playwright 启动或复用。`make check` 不执行 Playwright 测试或前端构建；它依次调用各个 Make 目标，任一步骤失败后停止。前端类型检查使用与生产构建相同的配置，不包含 Playwright 测试文件。`make format` 会调用现有前端脚本中的 `--unsafe` 自动修复，提交前请审核变更。

`make test-backend` 会执行 `backend/scripts/test.sh`，连接配置好的 PostgreSQL 实例并使用独立测试数据库。

也可以直接使用底层命令。

在本机安装后端依赖：

```bash
(cd backend && uv sync)
```

进入后端容器：

```bash
docker compose exec backend bash
```

运行后端测试：

```bash
(cd backend && bash ./scripts/test.sh)
```

即使 PostgreSQL 运行在 Docker 中，后端测试仍在本机执行。后端镜像包含应用代码，但不包含测试套件及其需要的全部根目录配置文件。

在仓库根目录运行前端检查：

```bash
bun run lint
bun run test
```

在后端容器中应用数据库迁移：

```bash
docker compose exec backend alembic upgrade head
```

修改后端模型后，在本机的仓库根目录生成迁移文件，并确保 `.env` 配置的数据库正在运行：

```bash
make migration MSG="describe change"
```

审核并提交 `backend/app/alembic/versions/` 下生成的文件。Compose Watch 只将本机变更同步到容器，容器内生成的文件不会自动复制回来。在 Docker 中应用新迁移前，请等待 Watch 完成同步，或重新构建并创建后端容器。

## 相关文档

- 后端开发：[backend/README.md](./backend/README.md)
- 后端架构与 AI 助手规则：[backend/AGENTS.md](./backend/AGENTS.md)
- 前端开发：[frontend/README.md](./frontend/README.md)
- 许可证及原始版权声明：[LICENSE](./LICENSE)

修改后端时，以 [backend/AGENTS.md](./backend/AGENTS.md) 中的架构规则为准。

## 致谢

本项目基于 [Full Stack FastAPI Template](https://github.com/fastapi/full-stack-fastapi-template)，使用 MIT 许可证。原始版权声明保留在 [LICENSE](./LICENSE) 中。

后端架构规则参考了 [FastAPI Best Practices](https://github.com/zhanymkanov/fastapi-best-practices)，并在 [backend/AGENTS.md](./backend/AGENTS.md) 中进行了适配。
