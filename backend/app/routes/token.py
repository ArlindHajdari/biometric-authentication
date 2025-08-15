from datetime import timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required, 
    get_jwt_identity
)
from app.config import Config
from app.db import SessionLocal
from app.models import User
from app.utils.hash_password import verify_password
from app.security.jwt_helpers import generate_tokens

token_bp = Blueprint("token", __name__)

@token_bp.post("/token")
def create_token():
    """Issue access + refresh tokens after login"""
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"msg": "Missing credentials"}), 400

    db = SessionLocal()
    try:
        user = db.query(User).filter_by(email=email).first()
        if not user or not verify_password(password, user.password_hash):
            return jsonify({"msg": "Invalid credentials"}), 401

        access_token, refresh_token = generate_tokens(email)

        return jsonify({
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "expires_in": Config.JWT_ACCESS_TTL_MIN * 60
        })
    finally:
        db.close()

@token_bp.post("/token/refresh")
@jwt_required(refresh=True)
def refresh_token():
    """Get a new access token using a valid refresh token"""
    identity = get_jwt_identity()
    new_access_token = create_access_token(
        identity=identity, 
        expires_delta=timedelta(minutes=Config.JWT_ACCESS_TTL_MIN)
    )
    return jsonify({
        "access_token": new_access_token,
        "token_type": "Bearer",
        "expires_in": Config.JWT_ACCESS_TTL_MIN * 60
    })
