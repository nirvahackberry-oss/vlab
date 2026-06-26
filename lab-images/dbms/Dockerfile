# MySQL + PostgreSQL + Oracle XE 21. Only DB engines + python3 for lab_server.
FROM gvenzl/oracle-xe:21-slim-faststart

ENV ORACLE_PASSWORD=student
ENV APP_USER=student
ENV APP_USER_PASSWORD=student

ENV MYSQL_ROOT_PASSWORD=root
ENV MYSQL_USER=student
ENV MYSQL_PASSWORD=student
ENV MYSQL_DATABASE=labdb

ENV POSTGRES_USER=student
ENV POSTGRES_PASSWORD=student
ENV POSTGRES_DB=labdb
ENV PGDATA=/var/lib/pgsql/data

ENV DBMS_ENGINE=mysql

USER root

RUN microdnf install -y python3 mysql-server postgresql-server postgresql sudo \
    && microdnf clean all \
    && mkdir -p /workspace /var/run/mysqld /var/lib/mysql "${PGDATA}" /var/run/postgresql \
    && chown -R mysql:mysql /var/run/mysqld /var/lib/mysql \
    && chown -R postgres:postgres "${PGDATA}" /var/run/postgresql \
    && chown -R oracle:oinstall /opt/oracle \
    && chmod 777 /workspace \
    && echo "oracle ALL=(root) NOPASSWD: /app/init-mysql.sh, /app/init-postgres.sh" > /etc/sudoers.d/lab-init \
    && chmod 440 /etc/sudoers.d/lab-init

WORKDIR /app
COPY lab-images/common/lab_server.py /app/lab_server.py
COPY lab-images/dbms/init-mysql.sh /app/init-mysql.sh
COPY lab-images/dbms/init-postgres.sh /app/init-postgres.sh
COPY lab-images/dbms/start.sh /app/start.sh
RUN chmod +x /app/init-mysql.sh /app/init-postgres.sh /app/start.sh

# gvenzl Oracle XE must run as oracle; root causes listener.log permission failures.
USER oracle

EXPOSE 1521 3306 5432 8080
CMD ["/app/start.sh"]
