FROM eclipse-temurin:21-jdk-jammy

RUN apt-get update && apt-get install -y --no-install-recommends \
    maven \
    gradle \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
CMD ["sh", "-c", "tail -f /dev/null"]
