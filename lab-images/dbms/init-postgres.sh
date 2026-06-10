#!/bin/bash
set -euo pipefail

PGDATA="${PGDATA:-/var/lib/pgsql/data}"
PG_USER="${POSTGRES_USER:-student}"
PG_PASSWORD="${POSTGRES_PASSWORD:-student}"
PG_DATABASE="${POSTGRES_DB:-labdb}"

if [ ! -f "${PGDATA}/PG_VERSION" ]; then
  echo "Initializing PostgreSQL data directory..."
  mkdir -p "${PGDATA}" /var/run/postgresql
  chown -R postgres:postgres "${PGDATA}" /var/run/postgresql
  su - postgres -s /bin/bash -c "initdb -D '${PGDATA}'"
  echo "host all all 127.0.0.1/32 md5" >> "${PGDATA}/pg_hba.conf"
  echo "host all all ::1/128 md5" >> "${PGDATA}/pg_hba.conf"
fi

if ! pgrep -u postgres -f "postgres -D ${PGDATA}" >/dev/null 2>&1; then
  echo "Starting PostgreSQL..."
  su - postgres -s /bin/bash -c "pg_ctl -D '${PGDATA}' -l /tmp/postgres.log start"
fi

echo "Waiting for PostgreSQL..."
for _ in $(seq 1 60); do
  if su - postgres -s /bin/bash -c "pg_isready -q"; then
    echo "PostgreSQL is ready"
    break
  fi
  sleep 1
done

if ! su - postgres -s /bin/bash -c "psql -tAc \"SELECT 1 FROM pg_roles WHERE rolname='${PG_USER}'\"" | grep -q 1; then
  su - postgres -s /bin/bash -c "psql -v ON_ERROR_STOP=1" <<-EOSQL
CREATE USER ${PG_USER} WITH PASSWORD '${PG_PASSWORD}' SUPERUSER;
CREATE DATABASE ${PG_DATABASE} OWNER ${PG_USER};
EOSQL
fi
