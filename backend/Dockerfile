FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    git build-essential gcc && \
    pip install --no-cache-dir pipenv && \
    rm -rf /var/lib/apt/lists/*

COPY Pipfile ./

RUN pipenv lock

RUN pipenv install --deploy --system

COPY . .

CMD ["python", "run.py"]
