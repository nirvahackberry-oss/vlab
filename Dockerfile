FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    LAB_PORT=8888

RUN apt-get update && apt-get install -y --no-install-recommends \
    tini \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --shell /bin/bash labuser
WORKDIR /app

COPY lab_server.py /app/lab_server.py

RUN pip install --no-cache-dir fastapi uvicorn[standard]

USER labuser
EXPOSE 8888

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["python", "/app/lab_server.py"]
