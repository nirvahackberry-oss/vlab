FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --uid 1000 --shell /bin/bash labuser

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    LAB_WORKSPACE=/workspace

RUN pip install --no-cache-dir \
    numpy \
    pandas \
    matplotlib \
    paramiko \
    pytest

WORKDIR /workspace

# Ensure the runtime user can write to /workspace (used by ECS Exec writes/runs).
RUN mkdir -p /workspace && chown -R labuser:labuser /workspace

USER labuser

# Keep the task running for ECS Exec interactive commands.
CMD ["sh", "-c", "tail -f /dev/null"]
