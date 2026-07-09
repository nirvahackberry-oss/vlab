# Oracle XE-only DB lab (slim image; no MySQL/PostgreSQL).
FROM gvenzl/oracle-xe:21-slim-faststart

ENV ORACLE_PASSWORD=student \
    APP_USER=student \
    APP_USER_PASSWORD=student \
    DBMS_ENGINE=oracle \
    LAB_TYPE=oracle

USER root

RUN microdnf install -y python3 \
    && microdnf clean all \
    && mkdir -p /workspace \
    && chown -R oracle:oinstall /opt/oracle \
    && chmod 777 /workspace

WORKDIR /app
COPY lab-images/common/lab_server.py /app/lab_server.py
COPY lab-images/dbms/start-oracle.sh /app/start.sh
RUN chmod +x /app/start.sh

USER oracle

EXPOSE 1521 8080
CMD ["/app/start.sh"]
