FROM mcr.microsoft.com/dotnet/sdk:8.0

# Install useful tools
RUN apt-get update && apt-get install -y \
    git \
    curl \
    nano \
    unzip

# Create workspace
WORKDIR /workspace

# Install code-server (VS Code in browser)
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Expose IDE + ASP.NET ports
EXPOSE 8080
EXPOSE 5000
EXPOSE 5001

# Start VS Code Server
CMD ["code-server", "--bind-addr", "0.0.0.0:8080", "--auth", "none", "/workspace"]