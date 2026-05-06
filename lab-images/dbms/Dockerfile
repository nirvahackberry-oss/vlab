FROM postgres:15

ENV POSTGRES_USER=student
ENV POSTGRES_PASSWORD=student
ENV POSTGRES_DB=labdb

EXPOSE 5432
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY lab-images/common/lab_server.py /app/lab_server.py

EXPOSE 8080
CMD ["sh", "-c", "docker-entrypoint.sh postgres & python3 /app/lab_server.py"]
