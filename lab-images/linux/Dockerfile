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

USER labuser

# Keep the task running for ECS Exec interactive commands.
CMD ["sh", "-c", "tail -f /dev/null"]
