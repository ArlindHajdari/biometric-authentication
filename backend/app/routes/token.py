from datetime import timedelta
from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import (
    jwt_required, get_jwt_identity, set_refresh_cookies, unset_jwt_cookies
)
from app.config import Config
from app.db import SessionLocal
from app.models import User
from app.utils.hash_password import verify_password
from app.security.jwt_helpers import generate_tokens
from app.utils.logger import setup_logger

token_bp = Blueprint("token", __name__)
logger = setup_logger()

@token_bp.post("/token")
def create_token():
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

        resp = jsonify({
            "access_token": access_token,
            "token_type": "Bearer",
            "expires_in": Config.JWT_ACCESS_TTL_MIN * 60
        })
        
        set_refresh_cookies(resp, refresh_token)
        
        return resp
    finally:
        db.close()

@token_bp.post("/token/refresh")
@jwt_required(refresh=True, locations=["cookies"])
def refresh_token():
    identity = get_jwt_identity()
    logger.info(f"[refresh_token] Refreshing token for {identity}")
    access_token, refresh_token = generate_tokens(identity)
    
    resp = make_response({
        "access_token": access_token,
        "token_type": "Bearer",
        "expires_in": Config.JWT_ACCESS_TTL_MIN * 60
    })
    
    set_refresh_cookies(resp, refresh_token)
    return resp

@token_bp.post("/logout")
def logout():
    resp = make_response({"msg": "Logged out"})
    unset_jwt_cookies(resp)
    return resp