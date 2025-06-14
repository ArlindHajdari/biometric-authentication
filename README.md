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

#### Behavioral Biometrics & Artificial Intelligence Model

The backend leverages advanced AI techniques to continuously authenticate users based on their behavioral biometrics. The core logic is implemented in [`model_service.py`](backend/app/services/model_service.py), which handles feature extraction, model training, prediction, and data management.

**Feature Extraction:**
- For each user, behavioral metrics are collected: hold time, flight time, mouse velocity, click frequency, dwell time, scroll distance, keypress rate, and cursor variation.
- The `flatten_features` function computes the mean of each metric, transforming raw lists into a fixed-length feature vector suitable for model input.

**Model Training:**
- Each user has a dedicated model, trained on their behavioral data.
- The training pipeline includes:
  - **Scaling:** Features are standardized using `StandardScaler` to ensure consistent input for the models.
  - **Clustering:** `KMeans` with a single cluster is used to compute the centroid of the user's behavior in feature space. The maximum allowed distance (`D_max`) from the centroid is calculated as the mean plus two standard deviations of all distances.
  - **Anomaly Detection:** `OneClassSVM` is trained on the scaled features to distinguish genuine behavior from anomalies.
  - **Incremental Training:** If a model already exists for a user, new data is appended to previous training data, allowing the model to adapt over time.
- Trained models are persisted to disk using `joblib`, and the model files are stored in a Docker volume for durability.

**Scheduled Retraining:**
- The system periodically (every 2 minutes by default) retrains models for all users with new, untrained samples. After successful training, those samples are marked as "trained" in the database.

**Prediction & Authentication:**
- When a user attempts authentication, their current behavioral metrics are processed into a feature vector.
- The model predicts if the behavior is genuine using the SVM. Additionally, the distance from the current sample to the user's behavioral centroid is computed.
- A composite fitness score is calculated by combining the SVM prediction and the normalized distance score, weighted according to configuration.
- If the model or sufficient data is not available, the system defaults to storing the metrics for future training and may fall back to other authentication factors.

**Metrics Storage Optimization:**
- The system only stores behavioral samples if at least one metric contains data, preventing the database from being filled with empty or meaningless records.

**Key Functions in `model_service.py`:**
- `train_or_update_model`: Handles the full training pipeline for a user's model.
- `predict_user_authenticity`: Processes new metrics and returns a prediction and confidence score.
- `train_all_users`: Batch retrains models for all users with new data.
- `store_metrics_for_training`: Validates and stores new behavioral samples.
- `compute_fitness`: Combines model and IP trust scores for final authentication.

This AI-driven approach enables adaptive, user-specific, and privacy-preserving continuous authentication, significantly enhancing security beyond traditional methods.

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