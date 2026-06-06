#! /usr/bin/env bash
set -e
set -x

python -m app.commands.wait_for_db

bash scripts/test.sh "$@"
