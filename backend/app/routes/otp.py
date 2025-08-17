from flask import Blueprint, request, jsonify
from app.services.otp_service import verify_otp
from app.utils.logger import setup_logger
from app.services.ip_service import register_or_increment_ip
from flask_jwt_extended import jwt_required

otp_bp = Blueprint('otp', __name__)
logger = setup_logger()

@otp_bp.route("/verify_otp", methods=["POST"])
@jwt_required()
def verification():
    """
    Verify OTP for user and register/increment IP trust
    ---
    tags:
      - OTP
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            email:
              type: string
              example: alice@example.com
            otp:
              type: string
              example: "123456"
    responses:
      200:
        description: OTP verification result
        content:
          application/json:
            schema:
              type: object
              properties:
                verified:
                  type: boolean
      400:
        description: Missing details
        content:
          application/json:
            schema:
              type: object
              properties:
                error:
                  type: string
      500:
        description: OTP verification failed
        content:
          application/json:
            schema:
              type: object
              properties:
                error:
                  type: string
    """
    try:
        data = request.get_json()
        email = data.get("email")
        otp = data.get("otp")
        logger.info(f"Otp verification attempt for {email}")

        if not email or not otp:
            logger.warning("Missing email or otp")
            return jsonify({"error": "Missing details"}), 400

        verified = verify_otp(email, otp)
        
        if verified:
            ip = request.headers.get("X-Forwarded-For", request.remote_addr)
            
            register_or_increment_ip(email, ip)
            logger.info(f"OTP verified for {email}")
        
        return jsonify({"verified": verified})
    except Exception as e:
        logger.exception("Otp verification error", exc_info=e)
        return jsonify({"error": "OTP verification failed"}), 500
