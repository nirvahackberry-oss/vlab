ARG LAB_BASE_IMAGE=ubuntu:22.04
FROM ${LAB_BASE_IMAGE}

USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
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
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --chown=labuser:labuser lab-images/common/lab_server.py /app/lab_server.py

USER labuser
WORKDIR /workspace

EXPOSE 8080
CMD ["python3", "/app/lab_server.py"]
