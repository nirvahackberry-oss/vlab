#!/bin/bash
set -euo pipefail

MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-root}"
MYSQL_DATABASE="${MYSQL_DATABASE:-labdb}"
MYSQL_APP_USER="${MYSQL_USER:-student}"
MYSQL_APP_PASSWORD="${MYSQL_PASSWORD:-student}"

if [ ! -f /var/lib/mysql/auto.cnf ]; then
  echo "Initializing MySQL data directory..."
  mysqld --initialize-insecure --user=mysql --datadir=/var/lib/mysql
fi

if ! pgrep -x mysqld >/dev/null 2>&1; then
  echo "Starting MySQL..."
  mysqld --daemonize --user=mysql --datadir=/var/lib/mysql
fi

echo "Waiting for MySQL..."
for _ in $(seq 1 60); do
  if mysqladmin ping -h localhost --silent 2>/dev/null; then
    echo "MySQL is ready"
    break
  fi
  sleep 1
done

mysql -u root <<-EOSQL
ALTER USER 'root'@'localhost' IDENTIFIED BY '${MYSQL_ROOT_PASSWORD}';
CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\`;
CREATE USER IF NOT EXISTS '${MYSQL_APP_USER}'@'localhost' IDENTIFIED BY '${MYSQL_APP_PASSWORD}';
CREATE USER IF NOT EXISTS '${MYSQL_APP_USER}'@'%' IDENTIFIED BY '${MYSQL_APP_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${MYSQL_DATABASE}\`.* TO '${MYSQL_APP_USER}'@'localhost';
GRANT ALL PRIVILEGES ON \`${MYSQL_DATABASE}\`.* TO '${MYSQL_APP_USER}'@'%';
FLUSH PRIVILEGES;
EOSQL
