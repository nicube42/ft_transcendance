FROM python:3.8-slim

WORKDIR /app

COPY ./ai/files/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY ./ai/files /app

COPY ./ai/certs/t.crt /app/ssl/domain.crt
COPY ./ai/certs/t.key /app/ssl/domain.key

EXPOSE 5678

CMD ["python", "./ai.py"]
