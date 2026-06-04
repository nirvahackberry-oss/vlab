import os
from urllib.parse import urlparse

_raw = os.environ.get("JUPYTER_BASE_URL", "").strip()
if _raw:
    if _raw.startswith("http://") or _raw.startswith("https://"):
        _raw = urlparse(_raw).path or _raw
    c.NotebookApp.base_url = _raw if _raw.endswith("/") else f"{_raw}/"

c.NotebookApp.allow_origin = "*"
c.NotebookApp.allow_credentials = True
c.NotebookApp.disable_check_xsrf = True
c.NotebookApp.allow_remote_access = True
c.NotebookApp.trust_xheaders = True
c.NotebookApp.token = ""
c.NotebookApp.password = ""
c.NotebookApp.open_browser = False
c.NotebookApp.notebook_dir = "/workspace"
c.NotebookApp.default_url = "/notebooks/lab.ipynb"
c.NotebookApp.tornado_settings = {
    "headers": {
        "Content-Security-Policy": "frame-ancestors *",
        "X-Frame-Options": "",
        "Access-Control-Allow-Origin": "*",
    }
}
