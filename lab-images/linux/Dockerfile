FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    bash \
    vim \
    nano \
    curl \
    wget \
    net-tools \
    iputils-ping \
    dnsutils \
    procps \
    psmisc \
    lsof \
    grep \
    sed \
    gawk \
    coreutils \
    gcc \
    g++ \
    make \
    build-essential \
    netcat \
    socat \
    inetutils-telnet \
    tcpdump \
    iproute2 \
    python3 \
    python3-pip

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
