# Android lab images: ANDROID_VARIANT=build (default, SDK + platform-tools) or emulator (adds AVD).
# Starter project is not baked in; session bootstrap loads it from S3 (see bootstrap-starter.sh).
ARG LAB_BASE_IMAGE=465443875617.dkr.ecr.ap-south-1.amazonaws.com/vlab-dev-lab-base-linux:latest
ARG ANDROID_VARIANT=build
FROM ${LAB_BASE_IMAGE}

ARG ANDROID_VARIANT=build

USER root

ENV DEBIAN_FRONTEND=noninteractive \
    GRADLE_VERSION=8.2 \
    LAB_TYPE=android

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    curl \
    unzip \
    python3 \
    openjdk-17-jdk \
    libglu1-mesa \
    && rm -rf /var/lib/apt/lists/*

ENV ANDROID_HOME=/opt/android-sdk \
    ANDROID_SDK_ROOT=/opt/android-sdk \
    JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH="${JAVA_HOME}/bin:${PATH}:${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/emulator"

COPY lab-images/android/install-sdk.sh /tmp/install-sdk.sh
RUN chmod +x /tmp/install-sdk.sh \
    && /tmp/install-sdk.sh "${ANDROID_VARIANT}" \
    && rm -f /tmp/install-sdk.sh

RUN curl -fsSL "https://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip" -o /tmp/gradle.zip \
    && unzip -q /tmp/gradle.zip -d /opt \
    && ln -sf "/opt/gradle-${GRADLE_VERSION}/bin/gradle" /usr/local/bin/gradle \
    && rm /tmp/gradle.zip

WORKDIR /app
COPY --chown=labuser:labuser lab-images/common/lab_server.py /app/lab_server.py
COPY lab-images/android/bootstrap-starter.sh /usr/local/bin/bootstrap-android-starter.sh
COPY lab-images/common/session-entrypoint.sh /usr/local/bin/android-entrypoint.sh
RUN chmod +x /usr/local/bin/android-entrypoint.sh /usr/local/bin/bootstrap-android-starter.sh

RUN mkdir -p /home/labuser/.android /home/labuser/.gradle /workspace \
    && gradle --version \
    && chown -R labuser:labuser /workspace /home/labuser "${ANDROID_HOME}"

USER labuser
WORKDIR /workspace

EXPOSE 8080
CMD ["/usr/local/bin/android-entrypoint.sh"]
