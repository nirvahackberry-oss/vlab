# Python runtime base only (no heavy science stack). ECR: ...-lab-base-python
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --uid 1000 --shell /bin/bash labuser

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    LAB_WORKSPACE=/workspace

WORKDIR /workspace
RUN mkdir -p /workspace && chown -R labuser:labuser /workspace

EXPOSE 8080
CMD ["python", "-m", "http.server", "8080", "--bind", "0.0.0.0", "--directory", "/workspace"]
