from flask import Blueprint, request, jsonify
from app.models import User
from app.services.otp_service import verify_otp
from app.utils.logger import setup_logger

otp_bp = Blueprint('otp', __name__)
logger = setup_logger(__name__)

@otp_bp.route("/verify_otp", methods=["POST"])
def verification():
    try:
        data = request.get_json()
        email = data.get("email")
        otp = data.get("otp")
        logger.info(f"Otp verification attempt for {email}")

        if not email or not otp:
            logger.warning("Missing email or otp")
            return jsonify({"error": "Missing details"}), 400

        verified = verify_otp(email, otp)
        
        return jsonify({"verified": verified})

    except Exception as e:
        logger.exception("Otp verification error", exc_info=e)
        return jsonify({"error": "OTP verification failed"}), 500
