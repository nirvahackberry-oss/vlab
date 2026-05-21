# Lean Ubuntu for linux-based labs. Per-lab tools live in child images. ECR: ...-lab-base-linux
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --uid 1000 --shell /bin/bash labuser

ENV LAB_WORKSPACE=/workspace

WORKDIR /workspace
RUN mkdir -p /workspace && chown -R labuser:labuser /workspace

EXPOSE 8080
# Child images override; keep the task alive if a lab has no custom CMD.
CMD ["sleep", "infinity"]
