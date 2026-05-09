ARG LAB_BASE_IMAGE=eclipse-temurin:21-jdk-jammy
FROM ${LAB_BASE_IMAGE}

WORKDIR /app
COPY --chown=labuser:labuser lab-images/common/lab_server.py /app/lab_server.py

USER labuser
WORKDIR /workspace

EXPOSE 8080
CMD ["python3", "/app/lab_server.py"]
