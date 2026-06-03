import os
from urllib.parse import urlparse

# Path-only base URL for reverse proxy (e.g. /api/lab-sessions/sess_xxx/jupyter/).
_raw = os.environ.get("JUPYTER_BASE_URL", "").strip()
if _raw:
    if _raw.startswith("http://") or _raw.startswith("https://"):
        _raw = urlparse(_raw).path or _raw
    c.ServerApp.base_url = _raw if _raw.endswith("/") else f"{_raw}/"
c.ServerApp.allow_origin = "*"
c.ServerApp.allow_origin_pat = ".*"
c.ServerApp.allow_credentials = True
c.ServerApp.disable_check_xsrf = True
c.ServerApp.allow_remote_access = True
c.ServerApp.trust_xheaders = True
c.ServerApp.token = ""
c.ServerApp.password = ""
c.ServerApp.open_browser = False
c.ServerApp.root_dir = "/workspace"

# Open the default notebook immediately (skip Launcher).
c.LabApp.default_url = "/lab/tree/lab.ipynb"
c.ServerApp.default_url = "/lab/tree/lab.ipynb"
c.MappingKernelManager.default_kernel_name = "python3"
c.ServerApp.tornado_settings = {
    "headers": {
        "Content-Security-Policy": "frame-ancestors *",
        "X-Frame-Options": "",
        "Access-Control-Allow-Origin": "*",
    }
}
