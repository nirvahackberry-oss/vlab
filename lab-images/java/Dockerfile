ARG LAB_BASE_IMAGE=465443875617.dkr.ecr.ap-south-1.amazonaws.com/vlab-dev-lab-base-java:latest
FROM ${LAB_BASE_IMAGE}

USER root

WORKDIR /app
COPY --chown=labuser:labuser lab-images/common/lab_server.py /app/lab_server.py

USER labuser
WORKDIR /workspace

EXPOSE 8080
CMD ["python3", "/app/lab_server.py"]
