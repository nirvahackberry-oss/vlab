ARG LAB_BASE_IMAGE=465443875617.dkr.ecr.ap-south-1.amazonaws.com/vlab-dev-lab-base-linux:latest
FROM ${LAB_BASE_IMAGE}

USER root

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    grep \
    sed \
    gawk \
    procps \
    psmisc \
    coreutils \
    findutils \
    net-tools \
    iputils-ping \
    dnsutils \
    lsof \
    gcc \
    g++ \
    make \
    build-essential \
    netcat-openbsd \
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
