# PostgreSQL-only DB lab (slim image; no Oracle/MySQL).
ARG LAB_BASE_IMAGE=465443875617.dkr.ecr.ap-south-1.amazonaws.com/vlab-dev-lab-base-linux:latest
FROM ${LAB_BASE_IMAGE}

USER root

ENV DEBIAN_FRONTEND=noninteractive \
    POSTGRES_USER=student \
    POSTGRES_PASSWORD=student \
    POSTGRES_DB=labdb \
    PGDATA=/var/lib/postgresql/data \
    DBMS_ENGINE=postgres \
    LAB_TYPE=postgres

RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql \
    postgresql-client \
    python3 \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /workspace "${PGDATA}" /var/run/postgresql \
    && chown -R postgres:postgres "${PGDATA}" /var/run/postgresql \
    && chmod 777 /workspace

WORKDIR /app
COPY lab-images/common/lab_server.py /app/lab_server.py
COPY lab-images/dbms/init-postgres.sh /app/init-postgres.sh
COPY lab-images/dbms/start-postgres.sh /app/start.sh
RUN chmod +x /app/init-postgres.sh /app/start.sh

# Pre-initialize cluster/users at build so cold starts only start postgres.
RUN /app/init-postgres.sh \
    && su - postgres -s /bin/bash -c "pg_ctl -D '${PGDATA}' -m fast stop"

EXPOSE 5432 8080
CMD ["/app/start.sh"]
