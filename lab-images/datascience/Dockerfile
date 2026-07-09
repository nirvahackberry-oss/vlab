ARG LAB_BASE_IMAGE=465443875617.dkr.ecr.ap-south-1.amazonaws.com/vlab-dev-lab-base-python:latest
FROM ${LAB_BASE_IMAGE}

USER root

ENV LAB_TYPE=datascience

RUN pip install --no-cache-dir \
    seaborn \
    scikit-learn \
    requests \
    beautifulsoup4 \
    notebook

ENV JUPYTER_CONFIG_DIR=/etc/jupyter
COPY lab-images/datascience/jupyter_server_config.py /etc/jupyter/jupyter_server_config.py
COPY lab-images/datascience/custom/custom.css /etc/jupyter/custom/custom.css
COPY lab-images/datascience/entrypoint.sh /usr/local/bin/datascience-entrypoint.sh
RUN chmod +x /usr/local/bin/datascience-entrypoint.sh

WORKDIR /workspace

EXPOSE 8888
CMD ["/usr/local/bin/datascience-entrypoint.sh"]
