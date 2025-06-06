from flask import Blueprint, request, jsonify
from app.db import SessionLocal
from app.models import User
from app.services.otp_service import send_otp
from app.services.ip_service import evaluate_ip_trust
from app.utils.hash_password import verify_password
from app.utils.logger import setup_logger
from app.services.model_service import predict_user_authenticity, store_metrics_for_training, compute_fitness

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
    db = SessionLocal()
    try:
        data = request.get_json()
        email = data.get("email")
        metrics = data.get("metrics", {})
        
        user = db.query(User).filter_by(email=email).first()
        if not user:
            logger.info(f"[AUTHENTICATE] User not found: {email}")
            return jsonify({"error": "User not found"}), 404
        
        store_metrics_for_training(email, metrics)
        
        if user.mode == "train":
            user.successful_logins += 1
            db.commit()
            logger.info(f"[TRAIN MODE] Gathering metrics for {email}")
            return jsonify({"authenticated": True, "confidence": 1.0})
        
        logger.info(f"Re-authenticating {email} with new metrics.")

        confidence = predict_user_authenticity(email, metrics)
        
        ip = request.headers.get("X-Forwarded-For", request.remote_addr)
        logger.info(f"[EVALUATING] Received users IP: {ip}")
        ip_score = evaluate_ip_trust(email, ip)
        fitness = round(compute_fitness(confidence, ip_score), 4)
        
        authenticated = bool(fitness >= 0.5)
        
        logger.info(f"Fitness details for {email}: Confidence => {confidence}, IP Score => {ip_score}, Fitness => {fitness}")
        
        if authenticated:
            user.successful_logins += 1
            db.commit()
            logger.info(f"[AUTHENTICATED]: User {email} successfully authenticated.")
        
        return jsonify({
            "authenticated": authenticated,
            "confidence": fitness
        }), 200
    except Exception as e:
        db.close()
        logger.exception(f"Authentication error: {str(e)}")
        return jsonify({"authenticated": False, "confidence": 0}), 500
    finally:
        db.close()