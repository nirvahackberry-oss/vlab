FROM eclipse-temurin:21-jdk-jammy

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    maven \
    gradle \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --uid 1000 --shell /bin/bash labuser

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    LAB_WORKSPACE=/workspace

WORKDIR /workspace

# Ensure runtime user can write to /workspace (used by ECS Exec writes/runs).
RUN mkdir -p /workspace && chown -R labuser:labuser /workspace

WORKDIR /app
COPY --chown=labuser:labuser lab-images/common/lab_server.py /app/lab_server.py

USER labuser

# Warm session: keep task alive and accept /execute requests.
EXPOSE 8080
CMD ["python3", "/app/lab_server.py"]
