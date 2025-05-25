import os

class Config:
    MODEL_PATH = "models"
    REDIS_HOST = "redis"
    REDIS_PORT = 6379
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 465
    SENDER_EMAIL = os.getenv("SENDER_EMAIL", "arlind.hajdari@gmail.com")
    SENDER_PASSWORD = os.getenv("SENDER_PASSWORD", "123123123")
    MODE = os.getenv("APP_MODE", "auth")
    
app_mode = {"mode": Config.MODE }
