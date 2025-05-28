from flask import Blueprint, request, jsonify
from app.db import SessionLocal
from app.models import IPTrustRequest, UserIP
from app.utils.logger import setup_logger
from datetime import datetime
from app.config import Config
from app.services.ip_service import send_ip_trust_approval_email

ip_bp = Blueprint('ip', __name__)
logger = setup_logger(__name__)

@ip_bp.route("/approve-ip", methods=["POST"])
def approve_ip():
    data = request.get_json()
    token = data.get("token")
    
    if not token:
        return jsonify({"error": "Missing token"}), 400

    db = SessionLocal()
    
    try:
        request_obj = db.query(IPTrustRequest).filter_by(id=token).first()

        if not request_obj:
            return jsonify({"error": "Invalid or expired token"}), 404

        if request_obj.confirmed:
            return jsonify({"message": "This IP has already been trusted."}), 200

        if request_obj.expires_at < datetime.utcnow():
            return jsonify({"error": "Token has expired."}), 410

        request_obj.confirmed = True
        db.commit()
        
        send_ip_trust_approval_email(request_obj.email, request_obj.ip_address)

        return jsonify({"message": f"IP {request_obj.ip_address} is now trusted for {request_obj.email}."}), 200
    except Exception as e:
        raise
    finally:
        db.close()
