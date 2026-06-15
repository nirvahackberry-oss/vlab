# Android SDK + Gradle starter project for mobile-app-lab (CLI build; no Studio GUI).
# GUI emulator needs KVM — use sdkmanager/avdmanager from the IDE terminal on Fargate if required.
ARG LAB_BASE_IMAGE=465443875617.dkr.ecr.ap-south-1.amazonaws.com/vlab-dev-lab-base-linux:latest
FROM ${LAB_BASE_IMAGE}

USER root

ENV DEBIAN_FRONTEND=noninteractive \
    GRADLE_VERSION=8.2

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    curl \
    unzip \
    python3 \
    openjdk-17-jdk \
    libglu1-mesa \
    && rm -rf /var/lib/apt/lists/*

ENV ANDROID_HOME=/opt/android-sdk \
    JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH="${JAVA_HOME}/bin:${PATH}:${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/emulator"

RUN mkdir -p "${ANDROID_HOME}/cmdline-tools"

RUN wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O sdk.zip \
    && unzip sdk.zip -d "${ANDROID_HOME}/cmdline-tools" \
    && mv "${ANDROID_HOME}/cmdline-tools/cmdline-tools" "${ANDROID_HOME}/cmdline-tools/latest" \
    && rm sdk.zip

RUN yes | sdkmanager --licenses

RUN sdkmanager \
    "platform-tools" \
    "platforms;android-33" \
    "build-tools;33.0.2" \
    "emulator" \
    "system-images;android-33;google_apis;x86_64"

# Gradle 8.x for wrapper generation and image warmup (distro gradle is too old for AGP 8).
RUN curl -fsSL "https://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip" -o /tmp/gradle.zip \
    && unzip -q /tmp/gradle.zip -d /opt \
    && ln -sf "/opt/gradle-${GRADLE_VERSION}/bin/gradle" /usr/local/bin/gradle \
    && rm /tmp/gradle.zip

COPY lab-images/android/starter/ /workspace/
RUN echo "sdk.dir=${ANDROID_HOME}" > /workspace/local.properties \
    && cd /workspace \
    && gradle wrapper --gradle-version "${GRADLE_VERSION}" \
    && chmod +x /workspace/build.sh /workspace/gradlew

WORKDIR /app
COPY --chown=labuser:labuser lab-images/common/lab_server.py /app/lab_server.py
COPY lab-images/android/entrypoint.sh /usr/local/bin/android-entrypoint.sh
RUN chmod +x /usr/local/bin/android-entrypoint.sh \
    && chown -R labuser:labuser /workspace

USER labuser
WORKDIR /workspace

# Pre-download Gradle deps and verify the starter project builds inside the image.
RUN ./gradlew assembleDebug --no-daemon --stacktrace

EXPOSE 8080
CMD ["/usr/local/bin/android-entrypoint.sh"]
