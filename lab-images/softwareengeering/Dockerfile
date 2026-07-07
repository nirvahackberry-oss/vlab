ARG LAB_BASE_IMAGE=465443875617.dkr.ecr.ap-south-1.amazonaws.com/vlab-dev-lab-base-java:latest
FROM ${LAB_BASE_IMAGE}

USER root

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    graphviz \
    && rm -rf /var/lib/apt/lists/*

ENV PLANTUML_JAR=/tools/plantuml.jar
RUN mkdir -p /tools \
    && curl -fsSL -L https://github.com/plantuml/plantuml/releases/latest/download/plantuml.jar \
    -o "${PLANTUML_JAR}"

WORKDIR /app
COPY --chown=labuser:labuser lab-images/common/lab_server.py /app/lab_server.py

USER labuser
WORKDIR /workspace

EXPOSE 8080
CMD ["python3", "/app/lab_server.py"]
