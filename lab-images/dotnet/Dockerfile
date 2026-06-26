FROM mcr.microsoft.com/dotnet/sdk:8.0

ARG CODE_SERVER_VERSION=4.126.0

# Install useful tools
RUN apt-get update && apt-get install -y \
    ca-certificates \
    git \
    curl \
    nano \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Create workspace
WORKDIR /workspace

# Install code-server (VS Code in browser) from official .deb — install.sh can omit web bundles
COPY lab-images/common/install-code-server.sh /tmp/install-code-server.sh
RUN chmod +x /tmp/install-code-server.sh \
    && CODE_SERVER_VERSION="${CODE_SERVER_VERSION}" /tmp/install-code-server.sh \
    && rm /tmp/install-code-server.sh

# Expose IDE + ASP.NET ports
EXPOSE 8080
EXPOSE 5000
EXPOSE 5001

# Start VS Code Server
CMD ["code-server", "--bind-addr", "0.0.0.0:8080", "--auth", "none", "/workspace"]