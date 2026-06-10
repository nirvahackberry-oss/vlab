# Jupyter iframe — AWS fixes for your engineer

## Problem
Students open **Data Science-I** lab but Jupyter stays blank in the iframe because:

1. **Security group** blocks browser traffic to port **8080** (and often **8080**) on ECS task public IPs.
2. **Big Data Analytics** lab is **not** Jupyter — only **Data Science-I** (`data-science-lab`) runs Jupyter on **8080**.

## Required AWS changes (Terraform)

File: `terraform/security_groups.tf` (already updated in repo)

Apply:

```bash
cd terraform
terraform plan
terraform apply
```

This adds:

| Port | Purpose | Source |
|------|---------|--------|
| **8080** | JupyterLab | `0.0.0.0/0` (browsers) + Lambda SG |
| **8080** | code-server / lab API | `0.0.0.0/0` (browsers) + Lambda SG (existing) |

Variable: `lab_browser_ingress_cidr_blocks` (default `["0.0.0.0/0"]`). Restrict in production if needed.

## Rebuild datascience Docker image

After pulling latest repo:

```bash
# Build & push datascience image, then force new ECS deployment
```

Config changes: `lab-images/datascience/jupyter_server_config.py` and `Dockerfile` allow iframe embedding.

## Backend (already in repo)

- Jupyter is proxied at:  
  `GET {API}/lab-sessions/{sessionId}/jupyter/lab?access_token=...`
- Set env for correct iframe links:

```env
API_PUBLIC_URL=http://YOUR_API_HOST:8082/api
```

Restart API after deploy: `npm start` in `backend/`.

## Which lab to test

| Lab card | Jupyter? | Port |
|----------|----------|------|
| **Data Science-I** | Yes | 8080 |
| Big Data Analytics | No | — |
| Python / Java | Built-in editor in app | 8080 API only |

## Quick verification

1. Start **Data Science-I** lab.
2. Network tab: iframe URL should be like  
   `http://localhost:8082/api/lab-sessions/sess_xxx/jupyter/lab?access_token=...`
3. From your PC (optional):  
   `curl -I "http://<TASK_PUBLIC_IP>:8080/lab"`  
   Should return HTTP 200/302, not timeout.

If `curl` times out → security group not applied yet.
