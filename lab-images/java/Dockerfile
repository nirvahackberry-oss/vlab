FROM openjdk:21-jdk-slim

RUN apt-get update && apt-get install -y \
    maven \
    gradle \
    git \
    curl

WORKDIR /workspace
CMD ["bash"]
