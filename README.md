# Behavioral Biometrics Authentication System

This project is a full-stack solution for continuous user authentication using behavioral biometrics (keystroke and mouse dynamics) and multi-factor authentication (OTP). It consists of a **backend** (Flask API with AI model training and database) and a **frontend** (React app for user interaction).

---

## Architecture Overview

- **Backend:** Python Flask REST API, PostgreSQL, Redis, Elasticsearch, and scheduled AI model training.
- **Frontend:** React app for login, OTP, and behavioral monitoring.
- **Dockerized:** All services are orchestrated using Docker Compose for easy setup and deployment.

---

## Backend

- **Location:** [`backend/`](backend/)
- **Tech Stack:** Flask, SQLAlchemy, PostgreSQL, Redis, Elasticsearch, APScheduler, scikit-learn
- **Key Features:**
  - User authentication with password and OTP (email-based)
  - Continuous behavioral authentication using keystroke and mouse metrics
  - AI model training and updating per user (SGDClassifier)
  - Model persistence and scheduled retraining
  - Logging to console and Elasticsearch
  - RESTful API endpoints for login, OTP verification, mode switching, and behavioral metrics

### Main Components

- `app/routes/`: API endpoints for authentication, OTP, and mode management
- `app/services/`: Business logic for OTP and model training/prediction
- `app/models.py`: SQLAlchemy models for users and training samples
- `app/utils/`: Logging, password hashing, and data generation utilities
- `db/`: PostgreSQL Dockerfile and seed SQL for initial schema/data

---

## Frontend

- **Location:** [`frontend/`](frontend/)
- **Tech Stack:** React, Material UI, Axios
- **Key Features:**
  - User login form
  - OTP verification form
  - Behavioral monitoring (keystroke and mouse metrics collection)
  - Continuous authentication and feedback to the user
  - Responsive and user-friendly UI

### Main Components

- `src/components/`: Login, OTP, and behavioral monitoring UI
- `src/hooks/`: Custom React hooks for capturing behavioral metrics

---

## Running the Project

### Prerequisites

- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd Project
   ```

2. **Start all services:**
   ```bash
   docker-compose up --build
   ```

3. **Access the apps:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:5001/api](http://localhost:5001/api)
   - Kibana (logs): [http://localhost:5601](http://localhost:5601)
   - Elasticsearch: [http://localhost:9200](http://localhost:9200)

---

## Development Notes

- **Backend environment variables** are set in `backend/.env`.
- **Model files** are persisted in a Docker volume (`model_data`).
- **Database** is seeded with demo users and schema on first run.
- **Logs** are sent to both console and Elasticsearch for monitoring.

---

## Folder Structure

```
Project/
├── backend/
│   ├── app/
│   ├── db/
│   ├── model/
│   ├── Dockerfile
│   └── ...
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── ...
├── docker-compose.yml
└── README.md
```

---

## Authors

- [Arlind Hajdari](mailto:arlind.hajdari@gmail.com)