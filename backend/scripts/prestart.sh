#! /usr/bin/env bash

set -e
set -x

# Let the DB start
python -m app.commands.wait_for_db

# Run migrations
alembic upgrade head

# Create initial data in DB
python -m app.commands.initial_data
