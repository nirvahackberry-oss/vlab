ARG LAB_BASE_IMAGE=465443875617.dkr.ecr.ap-south-1.amazonaws.com/vlab-dev-lab-base-linux:latest
FROM ${LAB_BASE_IMAGE}

USER root

ENV DEBIAN_FRONTEND=noninteractive
ENV LAB_NAME="linux-lab" \
    LAB_VERSION="1.0.0"

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    coreutils \
    grep \
    sed \
    gawk \
    procps \
    psmisc \
    findutils \
    iproute2 \
    build-essential \
    gcc \
    net-tools \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Make it obvious the user is inside the lab container:
# - Banner once per interactive shell session
# - Prompt tag with lab name
RUN printf '%s\n' \
  '#!/usr/bin/env bash' \
  '' \
  '# Only apply to interactive shells' \
  'case "$-" in *i*) ;; *) return ;; esac' \
  '' \
  '# Print a banner once per session' \
  'if [ -z "${LAB_BANNER_SHOWN:-}" ]; then' \
  '  export LAB_BANNER_SHOWN=1' \
  '  echo "=================================================="' \
  '  echo "  You are inside: ${LAB_NAME:-lab}  v${LAB_VERSION:-dev}"' \
  '  echo "  Container: $(hostname)"' \
  '  echo "=================================================="' \
  'fi' \
  '' \
  '# Prompt: [lab] user@host:/path$' \
  'LAB_TAG="[${LAB_NAME:-lab}]"' \
  'PS1="\[\e[1;35m\]${LAB_TAG}\[\e[0m\] \u@\h:\w\\$ "' \
  'export PS1' \
  > /etc/profile.d/lab.sh \
  && chmod +x /etc/profile.d/lab.sh \
  && printf '%s\n' \
  '' \
  '# Ensure lab config loads for interactive bash shells' \
  'if [ -r /etc/profile.d/lab.sh ]; then . /etc/profile.d/lab.sh; fi' \
  >> /etc/bash.bashrc

WORKDIR /app
COPY --chown=labuser:labuser lab-images/common/lab_server.py /app/lab_server.py

USER labuser
WORKDIR /workspace

EXPOSE 8080
CMD ["python3", "/app/lab_server.py"]
