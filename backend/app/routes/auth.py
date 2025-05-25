from flask import Blueprint, request, jsonify
from app.db import SessionLocal
from app.models import User
from app.services.otp_service import send_otp
from app.utils.hash_password import verify_password
from app.utils.logger import setup_logger
from app.services.model_service import load_model, predict_user, store_metrics_for_training
from app.config import app_mode

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
        logger.exception(f"Login error with exception: {str(e)}")
        return jsonify({"error": "Login failed"}), 500

@auth_bp.route("/authenticate", methods=["POST"])
def authenticate():
    try:
        data = request.get_json()
        email = data.get("email")
        metrics = data.get("metrics", {})
        
        store_metrics_for_training(email, metrics)
        
        if app_mode["mode"] == "train":
            logger.info(f"[TRAIN MODE] Gathering metrics for {email}")
            return jsonify({"authenticated": True, "confidence": 1.0})
        
        logger.info(f"Re-authenticating {email} with new metrics.")

        model = load_model(email)
        confidence = predict_user(email, metrics, model)

        logger.info(f"Confidence dropped for {email}: {confidence}")

        return jsonify({
            "authenticated": confidence >= 0.5,
            "confidence": confidence
        })
    except Exception as e:
        logger.exception(f"Authentication error: {str(e)}")
        return jsonify({"authenticated": False, "confidence": 0}), 500