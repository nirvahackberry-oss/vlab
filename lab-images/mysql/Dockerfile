# MySQL-only DB lab (slim image; no Oracle/PostgreSQL).
ARG LAB_BASE_IMAGE=465443875617.dkr.ecr.ap-south-1.amazonaws.com/vlab-dev-lab-base-linux:latest
FROM ${LAB_BASE_IMAGE}

USER root

ENV DEBIAN_FRONTEND=noninteractive \
    MYSQL_ROOT_PASSWORD=root \
    MYSQL_USER=student \
    MYSQL_PASSWORD=student \
    MYSQL_DATABASE=labdb \
    DBMS_ENGINE=mysql \
    LAB_TYPE=mysql

RUN apt-get update && apt-get install -y --no-install-recommends \
    mysql-server \
    python3 \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /workspace /var/run/mysqld /var/lib/mysql \
    && chown -R mysql:mysql /var/run/mysqld /var/lib/mysql \
    && chmod 777 /workspace

WORKDIR /app
COPY lab-images/common/lab_server.py /app/lab_server.py
COPY lab-images/dbms/init-mysql.sh /app/init-mysql.sh
COPY lab-images/dbms/start-mysql.sh /app/start.sh
RUN chmod +x /app/init-mysql.sh /app/start.sh

# Pre-initialize schema/users at build so cold starts only start mysqld.
RUN mysqld --initialize-insecure --user=mysql --datadir=/var/lib/mysql \
    && /app/init-mysql.sh \
    && mysqladmin -u root -p"${MYSQL_ROOT_PASSWORD}" shutdown

EXPOSE 3306 8080
CMD ["/app/start.sh"]
