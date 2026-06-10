#!/bin/bash
# Invoked by gvenzl/container-entrypoint.sh after Oracle XE is ready.
set -euo pipefail

/app/init-mysql.sh
/app/init-postgres.sh

echo "Starting lab API on port ${LAB_SERVER_PORT:-8080}..."
exec python3 /app/lab_server.py
