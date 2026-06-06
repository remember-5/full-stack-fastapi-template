#! /usr/bin/env bash

set -e
set -x

cd "$(dirname "$0")/../backend"

sh scripts/lint.sh
sh scripts/test.sh

cd ..

bun run lint
bash ./scripts/check-openapi.sh
