ARG LAB_BASE_IMAGE
FROM ${LAB_BASE_IMAGE}

USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
    openjdk-17-jdk \
    libglu1-mesa \
    && rm -rf /var/lib/apt/lists/*

ENV ANDROID_HOME=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

RUN mkdir -p $ANDROID_HOME/cmdline-tools

RUN wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O sdk.zip \
    && unzip sdk.zip -d $ANDROID_HOME/cmdline-tools \
    && mv $ANDROID_HOME/cmdline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest \
    && rm sdk.zip

RUN yes | sdkmanager --licenses

RUN sdkmanager \
    "platform-tools" \
    "platforms;android-33" \
    "build-tools;33.0.2" \
    "emulator" \
    "system-images;android-33;google_apis;x86_64"

RUN apt-get update && apt-get install -y --no-install-recommends gradle \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
