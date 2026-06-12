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
    gdb \
    make \
    net-tools \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Make it obvious the user is inside the lab container.
RUN printf '%s\n' \
  '#!/usr/bin/env bash' \
  'case "$-" in *i*) ;; *) return ;; esac' \
  '# Print a welcome message once per session' \
  'if [ -z "${LAB_BANNER_SHOWN:-}" ]; then' \
  '  export LAB_BANNER_SHOWN=1' \
  '  echo "welcome to ignitolearn Linux lab "' \
  'fi' \
  '# Prompt: [lab] user@host:/path$' \
  'LAB_TAG="[${LAB_NAME:-lab}]"' \
  'PS1="\[\e[1;35m\]${LAB_TAG}\[\e[0m\] \u@\h:\w\\$ "' \
  'export PS1' \
  > /etc/profile.d/lab.sh \
  && chmod +x /etc/profile.d/lab.sh \
  && printf '%s\n' \
  '# Ensure lab config loads for interactive bash shells' \
  'if [ -r /etc/profile.d/lab.sh ]; then . /etc/profile.d/lab.sh; fi' \
  >> /etc/bash.bashrc

WORKDIR /app
COPY --chown=labuser:labuser lab-images/common/lab_server.py /app/lab_server.py

USER labuser
WORKDIR /workspace

EXPOSE 8080
CMD ["python3", "/app/lab_server.py"]
