FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git build-essential gcc && \
    pip install --no-cache-dir pipenv && \
    rm -rf /var/lib/apt/lists/*

# Copy Pipfile and Pipfile.lock first to leverage caching
COPY Pipfile ./

RUN pipenv lock

# Install Python dependencies globally using pipenv
RUN pipenv install --deploy --system

# Copy application code
COPY . .

# Run the Flask app
CMD ["python", "run.py"]
