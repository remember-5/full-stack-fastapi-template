#! /usr/bin/env bash

set -e
set -x

cd "$(dirname "$0")/../backend"

sh scripts/format.sh

cd ..

bun run --filter frontend format
