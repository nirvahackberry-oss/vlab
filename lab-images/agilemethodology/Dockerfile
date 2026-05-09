ARG LAB_BASE_IMAGE
FROM ${LAB_BASE_IMAGE}

USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*
