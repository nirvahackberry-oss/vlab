FROM python:3.12-slim

RUN pip install --no-cache-dir boto3

WORKDIR /app
COPY backend/app.py /app/app.py

EXPOSE 8000
CMD ["python", "/app/app.py"]

