import smtplib
from email.message import EmailMessage
from app.config import Config
from app.utils.logger import setup_logger
import smtplib, ssl

logger = setup_logger(__name__)
    
def send_email(to, subject, body):
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = Config.SENDER_EMAIL
    msg["To"] = to
    msg.set_content(body)

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(Config.SMTP_SERVER, Config.SMTP_PORT, context=context) as server:
            server.login(Config.SENDER_EMAIL, Config.SENDER_PASSWORD)
            server.send_message(msg)
        logger.info(f"Email sent to {to}: {subject}")
    except Exception as e:
        logger.exception(f"Failed to send email to {to}: {e}")
        raise
