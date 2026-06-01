ARG LAB_BASE_IMAGE=465443875617.dkr.ecr.ap-south-1.amazonaws.com/vlab-dev-lab-base-python:latest
FROM ${LAB_BASE_IMAGE}

USER root

RUN pip install --no-cache-dir \
    paramiko \
    pytest

WORKDIR /app
COPY --chown=labuser:labuser lab-images/common/lab_server.py /app/lab_server.py

USER labuser
WORKDIR /workspace

EXPOSE 8080
CMD ["python", "/app/lab_server.py"]
