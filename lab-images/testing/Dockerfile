ARG LAB_BASE_IMAGE=465443875617.dkr.ecr.ap-south-1.amazonaws.com/vlab-dev-lab-base-linux:latest
FROM eclipse-temurin:24-jdk-jammy AS jdk24
FROM ${LAB_BASE_IMAGE}

USER root

COPY --from=jdk24 /opt/java/openjdk /opt/java/openjdk

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    JAVA_HOME=/opt/java/openjdk \
    CHROME_BIN=/usr/bin/google-chrome \
    CHROMEDRIVER_PATH=/usr/bin/chromedriver \
    SELENIUM_IDE_EXTENSION_PATH=/opt/selenium-ide-extension

ENV PATH="${JAVA_HOME}/bin:${PATH}"

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    curl \
    unzip \
    gnupg \
    ca-certificates \
    software-properties-common \
    maven \
    && rm -rf /var/lib/apt/lists/*

# Python 3.7 (deadsnakes) — syllabus lists 3.7.0; image ships latest 3.7.x patch
RUN add-apt-repository -y ppa:deadsnakes/ppa \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
    python3.7 \
    python3.7-distutils \
    && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL https://bootstrap.pypa.io/pip/3.7/get-pip.py -o /tmp/get-pip.py \
    && python3.7 /tmp/get-pip.py \
    && rm /tmp/get-pip.py \
    && ln -sf /usr/bin/python3.7 /usr/local/bin/python3 \
    && ln -sf /usr/bin/python3.7 /usr/local/bin/python

RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" \
    > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

RUN set -eux; \
    CHROME_FULL_VERSION="$(google-chrome --version | awk '{print $3}')"; \
    CHROME_MAJOR_VERSION="$(printf '%s' "$CHROME_FULL_VERSION" | cut -d. -f1)"; \
    CFT_VERSION="$(wget -qO- "https://googlechromelabs.github.io/chrome-for-testing/LATEST_RELEASE_${CHROME_MAJOR_VERSION}" || true)"; \
    if [ -z "$CFT_VERSION" ]; then CFT_VERSION="$CHROME_FULL_VERSION"; fi; \
    wget -q -O /tmp/chromedriver-linux64.zip "https://storage.googleapis.com/chrome-for-testing-public/${CFT_VERSION}/linux64/chromedriver-linux64.zip"; \
    unzip -q /tmp/chromedriver-linux64.zip -d /tmp; \
    mv /tmp/chromedriver-linux64/chromedriver /usr/bin/chromedriver; \
    chmod +x /usr/bin/chromedriver; \
    rm -rf /tmp/chromedriver-linux64.zip /tmp/chromedriver-linux64

# Selenium IDE v3.17.2 browser extension (last Chrome WebExtension release)
RUN set -eux; \
    wget -q -O /tmp/selenium-ide.zip "https://github.com/SeleniumHQ/selenium-ide/releases/download/v3.17.2/selenium-ide.zip"; \
    unzip -q /tmp/selenium-ide.zip -d /tmp/selenium-ide; \
    EXT_DIR="$(find /tmp/selenium-ide -name manifest.json -printf '%h\n' | head -n1)"; \
    mv "${EXT_DIR}" /opt/selenium-ide-extension; \
    rm -rf /tmp/selenium-ide.zip /tmp/selenium-ide; \
    test -f /opt/selenium-ide-extension/manifest.json

# Launch Chrome with the bundled Selenium IDE extension (MV2; use for record/playback labs)
RUN printf '%s\n' \
    '#!/bin/sh' \
    'exec /usr/bin/google-chrome --load-extension=/opt/selenium-ide-extension --disable-extensions-except=/opt/selenium-ide-extension "$@"' \
    > /usr/local/bin/chrome-selenium-ide \
    && chmod +x /usr/local/bin/chrome-selenium-ide

# Selenium WebDriver Python bindings (last release supporting Python 3.7)
RUN python3.7 -m pip install --no-cache-dir "selenium==4.11.2"

WORKDIR /app
COPY --chown=labuser:labuser lab-images/common/lab_server.py /app/lab_server.py

USER labuser
WORKDIR /workspace

EXPOSE 8080
CMD ["python3", "/app/lab_server.py"]
