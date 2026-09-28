#! /usr/bin/env bash

set -e
set -x

cd "$(dirname "$0")/.."

tmp_openapi="$(mktemp)"
trap 'rm -f "$tmp_openapi"' EXIT

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
else
  set -a
  . ./.env.example
  set +a
fi

cd backend
uv run --locked python -c "import app.main; import json; print(json.dumps(app.main.app.openapi()))" > "$tmp_openapi"
cd ..

diff -u frontend/openapi.json "$tmp_openapi"
