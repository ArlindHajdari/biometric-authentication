from flask import Blueprint, request, jsonify
from app.db import SessionLocal
from app.models import IPTrustRequest
from app.utils.logger import setup_logger
from datetime import datetime
from app.services.ip_service import send_ip_trust_approval_email

ip_bp = Blueprint('ip', __name__)
logger = setup_logger()

@ip_bp.route("/approve-ip", methods=["POST"])
def approve_ip():
    """
    Approve and trust a user's IP address using a token
    ---
    tags:
      - IP Trust
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            token:
              type: string
              description: Token received by email for IP approval
    responses:
      200:
        description: IP trusted successfully or already trusted
        content:
          application/json:
            schema:
              type: object
              properties:
                message:
                  type: string
      400:
        description: Missing token
        content:
          application/json:
            schema:
              type: object
              properties:
                error:
                  type: string
      404:
        description: Invalid or expired token
        content:
          application/json:
            schema:
              type: object
              properties:
                error:
                  type: string
      410:
        description: Token has expired
        content:
          application/json:
            schema:
              type: object
              properties:
                error:
                  type: string
    """
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
