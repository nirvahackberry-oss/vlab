import os
import platform
from datetime import datetime, timezone

from fastapi import FastAPI

app = FastAPI(title="Python Lab Runtime", version="1.0.0")


@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/")
def info():
    return {
        "message": "Ephemeral lab environment is running.",
        "lab_type": os.getenv("LAB_TYPE", "python"),
        "python_version": platform.python_version(),
        "hostname": platform.node(),
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("LAB_PORT", "8888"))
    uvicorn.run(app, host="0.0.0.0", port=port)
