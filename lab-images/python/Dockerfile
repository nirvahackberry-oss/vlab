FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    tini \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --uid 1000 --shell /bin/bash labuser

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    LAB_PORT=8888 \
    LAB_WORKSPACE=/workspace

RUN pip install --no-cache-dir \
    fastapi \
    "uvicorn[standard]" \
    numpy \
    pandas \
    matplotlib \
    paramiko \
    pytest

WORKDIR /workspace

# Build context is repo root (see .github/workflows/deploy.yml)
COPY lab_server.py /app/lab_server.py

USER labuser
EXPOSE 8888

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["python", "/app/lab_server.py"]
