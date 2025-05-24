import redis
import random
import string
import smtplib, ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import Config
from app.utils.logger import setup_logger

# Connect to Redis
r = redis.Redis(host=Config.REDIS_HOST, port=Config.REDIS_PORT, decode_responses=True)
logger = setup_logger(__name__)

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

def send_otp(email):
    try:
        otp = generate_otp()
        message = MIMEMultipart("alternative")
        message["Subject"] = "Your OTP Code"
        message["From"] = Config.SENDER_EMAIL
        message["To"] = email

        html = f"<html><body><h2>Your OTP: {otp}</h2></body></html>"
        message.attach(MIMEText(html, "html"))

        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(Config.SMTP_SERVER, Config.SMTP_PORT, context=context) as server:
            server.login(Config.SENDER_EMAIL, Config.SENDER_PASSWORD)
            server.sendmail(Config.SENDER_EMAIL, email, message.as_string())

        # Store OTP with 5-minute expiration
        r.setex(f"otp:{email}", 300, otp)
    except Exception as e:
        logger.exception("send_otp error", exc_info=e)
        raise

def verify_otp(email, code):
    try:
        key = f"otp:{email}"
        stored = r.get(key)
        if stored and stored == code:
            r.delete(key)
            return True
        return False
    except Exception as e:
        logger.exception("verify_otp error", exc_info=e)
        raise
