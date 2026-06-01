ARG LAB_BASE_IMAGE=465443875617.dkr.ecr.ap-south-1.amazonaws.com/vlab-dev-lab-base-linux:latest
FROM ${LAB_BASE_IMAGE}

USER root

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    CHROME_BIN=/usr/bin/google-chrome \
    CHROMEDRIVER_PATH=/usr/bin/chromedriver

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    unzip \
    gnupg \
    python3 \
    python3-pip \
    openjdk-17-jdk \
    maven \
    && rm -rf /var/lib/apt/lists/*

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

RUN pip install --no-cache-dir selenium

WORKDIR /workspace
