ARG LAB_BASE_IMAGE
FROM ${LAB_BASE_IMAGE}

USER root

RUN pip install --no-cache-dir \
    pandas \
    numpy \
    matplotlib \
    seaborn \
    scikit-learn \
    requests \
    beautifulsoup4 \
    jupyter

WORKDIR /workspace

EXPOSE 8080
CMD ["sh", "-c", "exec jupyter notebook --ip=0.0.0.0 --port=8080 --no-browser --allow-root --ServerApp.token='' --ServerApp.password=''"]
