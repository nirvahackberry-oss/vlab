import os

# Allow embedding Jupyter in a parent web app (e.g. React iframe via API proxy).
_proxy_base = os.environ.get("JUPYTER_BASE_URL", "").strip()
if _proxy_base:
    c.ServerApp.base_url = _proxy_base if _proxy_base.endswith("/") else f"{_proxy_base}/"
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
c.ServerApp.tornado_settings = {
    "headers": {
        "Content-Security-Policy": "frame-ancestors *",
        "X-Frame-Options": "",
        "Access-Control-Allow-Origin": "*",
    }
}
