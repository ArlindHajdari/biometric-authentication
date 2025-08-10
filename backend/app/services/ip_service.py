from app.models import UserIP, IPTrustRequest
from app.utils.mailer import send_email
from datetime import datetime, timedelta
from app.config import Config
from app.db import SessionLocal
from app.utils.logger import setup_logger
import requests

logger = setup_logger()

def send_ip_trust_request_email(email, ip, token):
    link = f"{Config.FRONTEND_BASE_URL}/approve-ip?token={token}"
    subject = "New IP Address Detected — Approve It?"
    body = f"""
    We've detected successful logins from a new IP: {ip}

    If this was you, click below to trust this IP in future logins:

    {link}

    This link will expire in 3 hours.
    """
    send_email(to=email, subject=subject, body=body)

def send_ip_trust_approval_email(email, ip):
    subject = "IP Address Approved"
    body = f"""
    Hello {email.split('@')[0]},

    The IP address {ip} has been successfully added as a trusted login location for your account.

    You will now experience faster login verification from this IP in future sessions.

    If you did not approve this change or have concerns, please contact support immediately.

    – BehavioralAuth Security

    """
    send_email(to=email, subject=subject, body=body)

def register_or_increment_ip(email, ip):
    db = SessionLocal()
    try:
        logger.info(f"[IP REGISTRATION] Email: {email}, IP: {ip}")
        existing = db.query(UserIP).filter_by(email=email, ip_address=ip).first()

        if existing:
            existing.successful_logins += 1
            existing.last_seen = datetime.utcnow()
            db.commit()
            if existing.successful_logins >= Config.AUTO_TRUST_THRESHOLD:
                ip_trust_request = db.query(IPTrustRequest).filter_by(
                    email=email, ip_address=ip
                ).first()
                
                if not ip_trust_request:
                    request = IPTrustRequest(
                        email=email,
                        ip_address=ip,
                        requested_at=datetime.utcnow(),
                        expires_at=datetime.utcnow() + timedelta(hours=3),
                        confirmed=False
                    )
                    db.add(request)
                    db.commit()
                    db.refresh(request)
                    send_ip_trust_request_email(email, ip, str(request.id))
                    
                    logger.info(f"[IP REGISTRATION] IP {ip} exceeded {Config.AUTO_TRUST_THRESHOLD} successful logins but has not confirmed the email. Confirmation sent.")
                elif ip_trust_request.confirmed:
                    logger.info(f"[IP REGISTRATION] IP {ip} already trusted for {email}. No action needed.")
                elif ip_trust_request.expires_at > datetime.utcnow():
                    logger.info(f"[IP REGISTRATION] IP {ip} already has a pending trust request for {email}. Resending confirmation email.")
                    ip_trust_request.expires_at=datetime.utcnow() + timedelta(hours=3)
                    db.commit()
                    send_ip_trust_request_email(email, ip, str(ip_trust_request.id))
                else:
                    logger.info(f"[IP REGISTRATION] IP {ip} already has a pending trust request for {email}. No action needed.")
                    
                return
            elif existing.successful_logins == Config.AUTO_TRUST_THRESHOLD:
                logger.info(f"[IP REGISTRATION] Existing IP and with this successful login has reached the threshold to be trusted. Sending trust request email.")
                
                request = IPTrustRequest(
                    email=email,
                    ip_address=ip,
                    requested_at=datetime.utcnow(),
                    expires_at=datetime.utcnow() + timedelta(hours=3),
                    confirmed=False
                )
                db.add(request)
                db.commit()
                send_ip_trust_request_email(email, ip, str(request.id))
                
                return
            else:
                logger.info(f"[IP REGISTRATION] Incrementing successful logins. Current count: {existing.successful_logins}")
                
        else:
            logger.info(f"[IP REGISTRATION] New IP detected for {email}. Registering new IP.")
            new_ip = UserIP(
                email=email,
                ip_address=ip,
                successful_logins=1,
                last_seen=datetime.utcnow()
            )
            db.add(new_ip)
        
        db.commit()
    except Exception as e:
        logger.exception(f"[IP REGISTRATION] Failed to register or increment_ip for {email} with exception: {e}")
        raise
    finally:
        db.close()

def evaluate_ip_trust(email, ip):
    db = SessionLocal()
    try:
        trusted = db.query(UserIP).filter_by(email=email, ip_address=ip).first()
        if trusted:
            if trusted.successful_logins >= Config.AUTO_TRUST_THRESHOLD:
                trust_request = db.query(IPTrustRequest).filter_by(
                    email=email, ip_address=ip
                ).first()
                
                if trust_request:
                    if trust_request.expires_at > datetime.utcnow() and not trust_request.confirmed:
                        logger.info(f"[IP EVALUATION] Score{ip}: 0.75 (Medium-high trust, pending approval)")
                        return 0.75
                    elif trust_request.confirmed:
                        logger.info(f"[IP EVALUATION] Score{ip}: 1.0 (trusted IP)")
                        return 1
                    else:
                        logger.info(f"[IP EVALUATION] Score{ip}: 0.5 (Medium trust, not yet confirmed)")
                        return 0.5
            else:
                logger.info(f"[IP EVALUATION] Score{ip}: 0.75 (Medium trust, not yet confirmed)")
                return 0.5

        logger.info(f"[IP EVALUATION] Score{ip}: 0 (untrusted IP)")
        return 0.0
    except Exception as e:
        logger.exception(f"Failed to evaluate ip trust for {email} with exception: {e}")
        raise
    finally:
        db.close()

def is_threat_ip(ip):
    try:
        logger.info(f"[is_threat_ip] IP: {ip}")
    
        url = f"https://api.ipdata.co/{ip}?api-key={Config.IP_TRUST_API_KEY}"
        resp = requests.get(url, timeout=5).json()
        
        logger.info(f"[is_threat_ip] IP Score response: {resp}")
        
        is_threat = resp.get("threat", {}).get("is_threat", False)
        is_known_abuser = resp.get("threat", {}).get("is_known_abuser", False)
        
        return is_threat and is_known_abuser
    except Exception as e:
        logger.exception(f"Failed to check threat IP {ip} with exception: {e}")
        return False