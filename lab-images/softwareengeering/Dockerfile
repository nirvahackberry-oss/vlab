ARG LAB_BASE_IMAGE=eclipse-temurin:21-jdk-jammy
FROM ${LAB_BASE_IMAGE}

USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
    nano \
    unzip \
    graphviz \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://code-server.dev/install.sh | sh

RUN mkdir -p /tools \
    && curl -fsSL -L https://github.com/plantuml/plantuml/releases/latest/download/plantuml.jar \
    -o /tools/plantuml.jar

WORKDIR /workspace

EXPOSE 8080
CMD ["code-server", "--bind-addr", "0.0.0.0:8080", "--auth", "none", "/workspace"]
