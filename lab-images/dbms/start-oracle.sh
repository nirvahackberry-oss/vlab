#!/bin/bash
# gvenzl/oracle-xe starts the database before this CMD runs.
set -euo pipefail

echo "Starting lab API on port ${LAB_SERVER_PORT:-8080}..."
exec python3 /app/lab_server.py
