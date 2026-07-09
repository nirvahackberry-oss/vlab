#!/bin/bash
set -euo pipefail

/app/init-mysql.sh

echo "Starting lab API on port ${LAB_SERVER_PORT:-8080}..."
exec python3 /app/lab_server.py
