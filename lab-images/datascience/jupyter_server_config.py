# Allow embedding Jupyter in a parent web app (e.g. React iframe).
c.ServerApp.allow_origin = "*"
c.ServerApp.allow_origin_pat = ".*"
c.ServerApp.allow_credentials = True
c.ServerApp.disable_check_xsrf = True
c.ServerApp.allow_remote_access = True
c.ServerApp.trust_xheaders = True
c.ServerApp.token = ""
c.ServerApp.password = ""

c.ServerApp.tornado_settings = {
    "headers": {
        "Content-Security-Policy": "frame-ancestors * 'self'",
        "X-Frame-Options": "",
    }
}
