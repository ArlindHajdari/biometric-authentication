from flask import Blueprint, request, jsonify
from app.db import SessionLocal
from app.models import User
from app.utils.logger import setup_logger

mode_bp = Blueprint("mode", __name__)
logger = setup_logger(__name__)

@mode_bp.route("/mode", methods=["GET"])
def get_mode():
    email = request.args.get("email")
    if not email:
        return jsonify({"error": "Email is required"}), 400

    session = SessionLocal()
    
    try:
        user = session.query(User).filter_by(email=email).first()
        session.close()
        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify({"mode": user.mode})
    except Exception as e:
        logger.error(f"Failed to retrieve mode for {email}: {e}")
        return jsonify({"error": "Failed to retrieve mode"}), 500
    finally:
        session.close()

@mode_bp.route("/mode", methods=["POST"])
def set_mode():
    data = request.get_json()
    email = data.get("email")
    new_mode = data.get("mode")

    if not email or not new_mode:
        return jsonify({"error": "Email and mode are required"}), 400
    
    if new_mode not in ["auth", "train"]:
        return jsonify({"error": "Invalid mode"}), 400
    
    try:
        session = SessionLocal()
        user = session.query(User).filter_by(email=email).first()
        
        if not user:
            session.close()
            return jsonify({"error": "User not found"}), 404

        user.mode = new_mode
        
        session.commit()
        session.close()
        
        return jsonify({"message": f"Mode set to {new_mode} for {email}"})
    except Exception as e:
        logger.error(f"Failed to set mode for {email}: {e}")
        return jsonify({"error": "Failed to set mode"}), 500
    finally:
        session.close()
