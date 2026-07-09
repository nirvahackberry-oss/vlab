# .NET lab: SDK + lab_server. MVC/console scaffolds load at session start from S3 (LAB_BOOTSTRAP_* env).
FROM mcr.microsoft.com/dotnet/sdk:8.0

ENV DEBIAN_FRONTEND=noninteractive \
    LAB_WORKSPACE=/workspace \
    DOTNET_CLI_TELEMETRY_OPTOUT=1 \
    DOTNET_NOLOGO=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DOTNET_SNIPPET_DIR=/opt/dotnet-snippet \
    DOTNET_WEB_PROJECT=/workspace/MyWebApp \
    LAB_TYPE=dotnet

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    python3 \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --uid 1000 --shell /bin/bash labuser \
    && mkdir -p /workspace /opt/dotnet-snippet \
    && chown -R labuser:labuser /workspace /opt/dotnet-snippet

WORKDIR /app
COPY lab-images/common/lab_server.py /app/lab_server.py
COPY lab-images/common/session-entrypoint.sh /usr/local/bin/lab-entrypoint.sh
RUN chmod +x /usr/local/bin/lab-entrypoint.sh

RUN chown -R labuser:labuser /app

USER labuser
WORKDIR /workspace

EXPOSE 8080
EXPOSE 5000
CMD ["/usr/local/bin/lab-entrypoint.sh"]
