#!/bin/bash
set -euo pipefail

MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-root}"
MYSQL_DATABASE="${MYSQL_DATABASE:-labdb}"
MYSQL_APP_USER="${MYSQL_USER:-student}"
MYSQL_APP_PASSWORD="${MYSQL_PASSWORD:-student}"
MYSQL_DATADIR="${MYSQL_DATADIR:-/var/lib/mysql}"
MYSQL_SOCKET="${MYSQL_SOCKET:-/var/run/mysqld/mysqld.sock}"
MYSQL_PID_FILE="${MYSQL_PID_FILE:-/var/run/mysqld/mysqld.pid}"

mkdir -p /var/run/mysqld "${MYSQL_DATADIR}"
chown -R mysql:mysql /var/run/mysqld "${MYSQL_DATADIR}"

if [ ! -f "${MYSQL_DATADIR}/auto.cnf" ]; then
  echo "Initializing MySQL data directory..."
  mysqld --initialize-insecure --user=mysql --datadir="${MYSQL_DATADIR}"
fi

if ! mysqladmin --socket="${MYSQL_SOCKET}" ping --silent 2>/dev/null; then
  echo "Starting MySQL..."
  mysqld \
    --user=mysql \
    --datadir="${MYSQL_DATADIR}" \
    --socket="${MYSQL_SOCKET}" \
    --pid-file="${MYSQL_PID_FILE}" \
    --daemonize
fi

echo "Waiting for MySQL..."
ready=false
for _ in $(seq 1 60); do
  if mysqladmin --socket="${MYSQL_SOCKET}" ping --silent 2>/dev/null; then
    echo "MySQL is ready"
    ready=true
    break
  fi
  sleep 1
done

if [ "${ready}" != "true" ]; then
  echo "MySQL failed to become ready" >&2
  exit 1
fi

mysql --socket="${MYSQL_SOCKET}" -u root <<-EOSQL
ALTER USER 'root'@'localhost' IDENTIFIED BY '${MYSQL_ROOT_PASSWORD}';
CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\`;
CREATE USER IF NOT EXISTS '${MYSQL_APP_USER}'@'localhost' IDENTIFIED BY '${MYSQL_APP_PASSWORD}';
CREATE USER IF NOT EXISTS '${MYSQL_APP_USER}'@'%' IDENTIFIED BY '${MYSQL_APP_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${MYSQL_DATABASE}\`.* TO '${MYSQL_APP_USER}'@'localhost';
GRANT ALL PRIVILEGES ON \`${MYSQL_DATABASE}\`.* TO '${MYSQL_APP_USER}'@'%';
FLUSH PRIVILEGES;
EOSQL
