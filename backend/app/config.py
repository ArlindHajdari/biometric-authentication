import os

class Config:
    FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")
    MODEL_PATH = "models"
    REDIS_HOST = "redis"
    REDIS_PORT = 6379
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 465
    SENDER_EMAIL = os.getenv("SENDER_EMAIL", "arlind.hajdari@gmail.com")
    SENDER_PASSWORD = os.getenv("SENDER_PASSWORD", "123123123")
    AUTO_TRUST_THRESHOLD = int(os.getenv("AUTO_TRUST_THRESHOLD", 3))
    IP_WEIGHT = os.getenv("IP_WEIGHT", 0.3)
    BIOMETRICS_WEIGHT = os.getenv("BIOMETRICS_WEIGHT", 0.7)
    CLUSTER_WEIGHT = os.getenv("CLUSTER_WEIGHT", 0.5)
    SVM_WEIGHT = os.getenv("SVM_WEIGHT", 0.5)
    MIN_SAMPLES_REQUIRED = int(os.getenv("MIN_SAMPLES_REQUIRED", 30))
    INCREMENTAL_TRAINING_ENABLED = bool(os.getenv("INCREMENTAL_TRAINING_ENABLED", True))
    IP_TRUST_API_KEY = os.getenv("IP_TRUST_API_KEY", "")
