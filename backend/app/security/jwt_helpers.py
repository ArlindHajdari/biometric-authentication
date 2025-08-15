from datetime import timedelta
from flask_jwt_extended import (
    create_access_token, 
    create_refresh_token
)
from app.config import Config

def generate_tokens(email: str) -> tuple:
    access_token = create_access_token(
        identity=email, 
        expires_delta=timedelta(minutes=Config.JWT_ACCESS_TTL_MIN)
    )
    refresh_token = create_refresh_token(
        identity=email,
        expires_delta=timedelta(days=Config.JWT_REFRESH_TTL_DAYS)
    )

    return access_token, refresh_token