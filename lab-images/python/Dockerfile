FROM python:3.11-slim

RUN pip install \
    numpy \
    pandas \
    matplotlib \
    paramiko \
    pytest

WORKDIR /workspace
CMD ["sh", "-c", "python3 -m http.server 8888 & tail -f /dev/null"]
