import redis
import random
import string
from app.config import Config
from app.utils.logger import setup_logger
from app.utils.mailer import send_email

# Connect to Redis
r = redis.Redis(host=Config.REDIS_HOST, port=Config.REDIS_PORT, decode_responses=True)
logger = setup_logger()

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

def send_otp(email):
    try:
        otp = generate_otp()
        
        send_email(to=email, subject="Biometrics - Your OTP Code", body=f"Your OTP is: {otp}\n\nIt will expire in 2 minutes.")
        
        r.setex(f"otp:{email}", 120, otp)
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
