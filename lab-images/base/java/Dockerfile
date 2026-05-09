# JVM base (Temurin) + tools shared by java + software-engineering labs. ECR: ...-lab-base-java
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
RUN mkdir -p /workspace && chown -R labuser:labuser /workspace

EXPOSE 8080
CMD ["python3", "-m", "http.server", "8080", "--bind", "0.0.0.0", "--directory", "/workspace"]
