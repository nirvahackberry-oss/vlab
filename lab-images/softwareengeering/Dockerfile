ARG LAB_BASE_IMAGE=465443875617.dkr.ecr.ap-south-1.amazonaws.com/vlab-dev-lab-base-java:latest
FROM ${LAB_BASE_IMAGE}

USER root

ENV DEBIAN_FRONTEND=noninteractive

ARG CODE_SERVER_VERSION=4.126.0

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    graphviz \
    && rm -rf /var/lib/apt/lists/*

COPY lab-images/common/install-code-server.sh /tmp/install-code-server.sh
RUN chmod +x /tmp/install-code-server.sh \
    && CODE_SERVER_VERSION="${CODE_SERVER_VERSION}" /tmp/install-code-server.sh \
    && rm /tmp/install-code-server.sh

ENV PLANTUML_JAR=/tools/plantuml.jar
RUN mkdir -p /tools \
    && curl -fsSL -L https://github.com/plantuml/plantuml/releases/latest/download/plantuml.jar \
    -o "${PLANTUML_JAR}"

COPY lab-images/common/drawio-landing.html /workspace/drawio.html

WORKDIR /workspace

EXPOSE 8080
CMD ["code-server", "--bind-addr", "0.0.0.0:8080", "--auth", "none", "/workspace"]
