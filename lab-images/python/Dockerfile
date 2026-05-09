ARG LAB_BASE_IMAGE
FROM ${LAB_BASE_IMAGE}

USER root

RUN pip install --no-cache-dir \
    numpy \
    pandas \
    matplotlib \
    paramiko \
    pytest

WORKDIR /app
COPY --chown=labuser:labuser lab-images/common/lab_server.py /app/lab_server.py

USER labuser
WORKDIR /workspace

EXPOSE 8080
CMD ["python", "/app/lab_server.py"]
