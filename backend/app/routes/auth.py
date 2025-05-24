from flask import Blueprint, request, jsonify
from app.db import SessionLocal
from app.models import User
from app.services.otp_service import send_otp
from app.utils.hash_password import verify_password
from app.utils.logger import setup_logger

auth_bp = Blueprint('auth', __name__)
logger = setup_logger(__name__)

@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")
        logger.info(f"Login attempt for {email}")

        if not email or not password:
            logger.warning("Missing email or password")
            return jsonify({"error": "Missing credentials"}), 400

        db = SessionLocal()
        user = db.query(User).filter(User.email == email).first()
        db.close()

        if not user or not verify_password(password, user.password):
            logger.warning(f"Invalid credentials for {email}")
            return jsonify({"error": "Invalid credentials"}), 401

        send_otp(email)
        logger.info(f"OTP sent to {email}")
        return jsonify({"message": "OTP sent"})

    except Exception as e:
        logger.exception("Login error")
        return jsonify({"error": "Login failed"}), 500
