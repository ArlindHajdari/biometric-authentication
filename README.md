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
- **Tech Stack:** Flask, SQLAlchemy, PostgreSQL, Redis, Elasticsearch, APScheduler, scikit-learn, Flasgger
- **Key Features:**
  - **User authentication** with password and OTP (email-based)
  - **Continuous behavioral authentication** using keystroke and mouse metrics
  - **AI model training and updating per user** (OneClassSVM, KMeans, StandardScaler)
  - **Model persistence and scheduled retraining** (every 2 minutes, configurable)
  - **Logging** to both console and Elasticsearch for observability
  - **RESTful API endpoints** for login, OTP verification, mode switching, and behavioral metrics
  - **IP Trust Management:** Tracks and manages trusted IPs, sends approval emails, and scores IP trust for authentication
  - **User Mode Switching:** Users can be in "train" or "auth" mode, affecting how authentication is handled
  - **Metrics Storage Optimization:** Metrics are only stored if they contain meaningful data (not all empty)
  - **OpenAPI/Swagger Documentation:** API is documented and browsable via Flasgger at `/apidocs`
  - **Global error handling and request/response logging**

### Main Components

- `app/routes/`: API endpoints for authentication, OTP, IP trust, and mode management
- `app/services/`: Business logic for OTP, model training/prediction, IP trust, and metrics storage
- `app/models.py`: SQLAlchemy models for users, training samples, IP trust requests, and user IPs
- `app/utils/`: Logging, password hashing, mailer, and other utilities
- `db/`: PostgreSQL Dockerfile and seed SQL for initial schema/data

### Detailed Features

#### Behavioral Biometrics & AI Model

- **Metrics Collected:** Hold time, flight time, mouse velocity, click frequency, dwell time, scroll distance, keypress rate, cursor variation
- **Model Training:** Per-user models are trained using OneClassSVM and KMeans, with feature scaling. Models are retrained periodically and incrementally.
- **Model Storage:** Models are persisted as files in a Docker volume, ensuring data is not lost on container restart.
- **Authentication:** In "auth" mode, user metrics are evaluated by the trained model and combined with IP trust score for a final fitness score.

#### Multi-Factor Authentication (OTP)

- **OTP Generation:** 6-digit codes sent via email using Redis for temporary storage and expiration.
- **OTP Verification:** Endpoint to verify OTP and register/increment IP trust on success.

#### IP Trust Management

- **IP Tracking:** Each login attempt records the user's IP and increments a counter.
- **Trust Threshold:** After a configurable number of successful logins, the system sends an email to approve the IP.
- **Approval Workflow:** Users approve new IPs via a secure link; trusted IPs improve authentication confidence.
- **IP Scoring:** IPs are scored (0.0 to 1.0) based on trust status and confirmation.

#### User Mode Switching

- **Modes:** Users can be in "train" (collecting data, always authenticated) or "auth" (model-based authentication) mode.
- **Endpoints:** `/mode` GET/POST endpoints allow querying and updating user mode.

#### Logging & Monitoring

- **Structured Logging:** All requests and responses are logged with metadata.
- **Elasticsearch Integration:** Logs are sent to Elasticsearch for analysis and visualization in Kibana.
- **Kibana:** Accessible at [http://localhost:5601](http://localhost:5601) for log monitoring.

#### API Documentation

- **Swagger/OpenAPI:** All endpoints are documented using Flasgger. Browse at `/apidocs` (e.g., [http://localhost:5001/apidocs](http://localhost:5001/apidocs)).

---

## Frontend

- **Location:** [`frontend/`](frontend/)
- **Tech Stack:** React, Material UI, Axios
- **Key Features:**
  - **User login form** with password
  - **OTP verification form** for multi-factor authentication
  - **Behavioral monitoring:** Collects keystroke and mouse metrics in real time
  - **Continuous authentication:** Sends metrics to backend for ongoing verification
  - **Session security:** Inactivity and suspicious behavior triggers logout dialogs
  - **IP Trust Approval:** UI for approving new IP addresses via secure token
  - **Responsive and user-friendly UI**

### Main Components

- `src/components/`: Login, OTP, behavioral monitor, and IP approval UI
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
   - API Docs: [http://localhost:5001/apidocs](http://localhost:5001/apidocs)
   - Kibana (logs): [http://localhost:5601](http://localhost:5601)
   - Elasticsearch: [http://localhost:9200](http://localhost:9200)

---

## Development Notes

- **Backend environment variables** are set in `backend/.env`.
- **Model files** are persisted in a Docker volume (`model_data`).
- **Database** is seeded with demo users and schema on first run.
- **Logs** are sent to both console and Elasticsearch for monitoring.
- **API documentation** is available and auto-generated via Flasgger.

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