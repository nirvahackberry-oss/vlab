#!/bin/bash
# Invoked by gvenzl/container-entrypoint.sh after Oracle XE is ready.
set -euo pipefail

# MySQL/PostgreSQL daemons require root; Oracle runs as oracle (see Dockerfile USER).
sudo /app/init-mysql.sh
sudo /app/init-postgres.sh

echo "Starting lab API on port ${LAB_SERVER_PORT:-8080}..."
exec python3 /app/lab_server.py
