from flask import Blueprint, request, jsonify
from app.config import app_mode

mode_bp = Blueprint("mode", __name__)

@mode_bp.route("/mode", methods=["GET"])
def get_mode():
    return jsonify({"mode": app_mode["mode"]})

@mode_bp.route("/mode", methods=["POST"])
def set_mode():
    new_mode = request.json.get("mode")
    if new_mode not in ["auth", "train"]:
        return jsonify({"error": "Invalid mode"}), 400
    app_mode["mode"] = new_mode
    return jsonify({"message": f"Mode set to {new_mode}"})
