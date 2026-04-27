FROM python:3.11-slim

RUN pip install \
    numpy \
    pandas \
    matplotlib \
    flask \
    requests \
    scipy

WORKDIR /workspace
CMD ["sh", "-c", "python3 -m http.server 8888 & tail -f /dev/null"]
