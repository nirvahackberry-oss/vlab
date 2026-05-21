ARG LAB_BASE_IMAGE=465443875617.dkr.ecr.ap-south-1.amazonaws.com/vlab-dev-lab-base-python:latest
FROM ${LAB_BASE_IMAGE}

USER root

RUN pip install --no-cache-dir \
    seaborn \
    scikit-learn \
    requests \
    beautifulsoup4 \
    jupyter \
    jupyterlab

ENV JUPYTER_CONFIG_DIR=/etc/jupyter
COPY lab-images/datascience/jupyter_server_config.py /etc/jupyter/jupyter_server_config.py

WORKDIR /workspace

EXPOSE 8888
CMD ["jupyter", "lab", "--ip=0.0.0.0", "--port=8888", "--no-browser", "--allow-root"]
