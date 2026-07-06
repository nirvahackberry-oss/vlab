# .NET lab: lab_server for console snippets; pre-scaffolded MVC + EF Core for web practicals.
FROM mcr.microsoft.com/dotnet/sdk:8.0

ENV DEBIAN_FRONTEND=noninteractive \
    LAB_WORKSPACE=/workspace \
    DOTNET_CLI_TELEMETRY_OPTOUT=1 \
    DOTNET_NOLOGO=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DOTNET_SNIPPET_DIR=/opt/dotnet-snippet \
    DOTNET_WEB_PROJECT=/workspace/MyWebApp

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    python3 \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --uid 1000 --shell /bin/bash labuser

# Pre-restored console project for paste-and-run snippets (variables, loops, OOP, LINQ, etc.)
RUN mkdir -p /opt/dotnet-snippet \
    && dotnet new console -o /opt/dotnet-snippet --force \
    && dotnet restore /opt/dotnet-snippet

# Full ASP.NET Core MVC + EF Core workspace for practicals 13–15 (controllers, views, CRUD).
RUN dotnet new mvc -o /workspace/MyWebApp -n MyWebApp --no-https -f net8.0 --force \
    && dotnet add /workspace/MyWebApp package Microsoft.EntityFrameworkCore.Sqlite --version 8.0.11 \
    && dotnet add /workspace/MyWebApp package Microsoft.EntityFrameworkCore.Design --version 8.0.11 \
    && dotnet restore /workspace/MyWebApp

WORKDIR /app
COPY lab-images/common/lab_server.py /app/lab_server.py

RUN chown -R labuser:labuser /workspace /opt/dotnet-snippet /app

USER labuser
WORKDIR /workspace

EXPOSE 8080
EXPOSE 5000

CMD ["python3", "/app/lab_server.py"]
