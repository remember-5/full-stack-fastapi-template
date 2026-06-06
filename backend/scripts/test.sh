#!/usr/bin/env bash

set -e
set -x

uv run pytest tests/ \
  --cov=app \
  --cov-report=term-missing \
  --cov-report=html
