#!/bin/bash
set -euo pipefail

PGDATA="${PGDATA:-/var/lib/postgresql/data}"
PG_USER="${POSTGRES_USER:-student}"
PG_PASSWORD="${POSTGRES_PASSWORD:-student}"
PG_DATABASE="${POSTGRES_DB:-labdb}"

for dir in /usr/lib/postgresql/*/bin; do
  if [ -x "${dir}/initdb" ]; then
    export PATH="${dir}:${PATH}"
    break
  fi
done

if ! command -v initdb >/dev/null 2>&1; then
  echo "PostgreSQL binaries not found in PATH" >&2
  exit 1
fi

run_as_postgres() {
  su - postgres -s /bin/bash -c "export PATH=\"${PATH}\"; $*"
}

if [ ! -f "${PGDATA}/PG_VERSION" ]; then
  echo "Initializing PostgreSQL data directory..."
  mkdir -p "${PGDATA}" /var/run/postgresql
  chown -R postgres:postgres "${PGDATA}" /var/run/postgresql
  run_as_postgres "initdb -D '${PGDATA}'"
  echo "host all all 127.0.0.1/32 md5" >> "${PGDATA}/pg_hba.conf"
  echo "host all all ::1/128 md5" >> "${PGDATA}/pg_hba.conf"
fi

if ! run_as_postgres "pg_ctl -D '${PGDATA}' status" >/dev/null 2>&1; then
  echo "Starting PostgreSQL..."
  run_as_postgres "pg_ctl -D '${PGDATA}' -l /tmp/postgres.log start"
fi

echo "Waiting for PostgreSQL..."
ready=false
for _ in $(seq 1 60); do
  if run_as_postgres "pg_isready -q"; then
    echo "PostgreSQL is ready"
    ready=true
    break
  fi
  sleep 1
done

if [ "${ready}" != "true" ]; then
  echo "PostgreSQL failed to become ready" >&2
  exit 1
fi

if ! run_as_postgres "psql -tAc \"SELECT 1 FROM pg_roles WHERE rolname='${PG_USER}'\"" | grep -q 1; then
  run_as_postgres "psql -v ON_ERROR_STOP=1" <<-EOSQL
CREATE USER ${PG_USER} WITH PASSWORD '${PG_PASSWORD}' SUPERUSER;
CREATE DATABASE ${PG_DATABASE} OWNER ${PG_USER};
EOSQL
fi
