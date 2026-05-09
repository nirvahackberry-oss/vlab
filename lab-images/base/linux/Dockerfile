# Lean Ubuntu stack for sysadmin / Node / Android / browser-test labs.
# ECR: ${project}-${env}-lab-base-linux — pass as: --build-arg LAB_BASE_IMAGE=<uri>:latest
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    wget \
    git \
    vim \
    nano \
    unzip \
    gnupg \
    python3 \
    python3-pip \
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
