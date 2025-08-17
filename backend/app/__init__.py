from flask import Flask, request, g
from flask_cors import CORS
from app.utils.logger import setup_logger
from datetime import datetime
import json
from app.services.model_service import train_all_users
from apscheduler.schedulers.background import BackgroundScheduler
from flasgger import Swagger
from app.config import Config
from flask_jwt_extended import JWTManager

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    Swagger(app)
    
    CORS(
        app, 
        resources={r"/api/*": {"origins": "http://localhost:3000"}},
        allow_headers=["Content-Type", "Authorization", "X-Forwarded-For","X-CSRF-TOKEN"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        supports_credentials=True
    )
    
    logger = setup_logger()
    
    jwt = JWTManager(app)

    @jwt.unauthorized_loader
    def _unauth(reason): return ({"msg": f"Missing/invalid token: {reason}"}, 401)
    
    @jwt.invalid_token_loader
    def _invalid(reason): return ({"msg": f"Invalid token: {reason}"}, 422)
    
    @jwt.expired_token_loader
    def _expired(h, p): return ({"msg": "Token expired"}, 401)

    # Register blueprints
    from app.routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api")

    from app.routes.otp import otp_bp
    app.register_blueprint(otp_bp, url_prefix="/api")
    
    from app.routes.ip import ip_bp
    app.register_blueprint(ip_bp, url_prefix="/api")
    
    from app.routes.mode import mode_bp
    app.register_blueprint(mode_bp, url_prefix="/api")
    
    from app.routes.token import token_bp
    app.register_blueprint(token_bp, url_prefix="/api")
    
    # Log every request
    @app.before_request
    def log_request_info():
        g.start_time = datetime.utcnow()

        try:
            data = request.get_json(silent=True) or request.form.to_dict() or {}
        except Exception as e:
            data = {"error": "Failed to parse body"}

        logger.info(json.dumps({
            "type": "request",
            "method": request.method,
            "path": request.path,
            "remote_addr": request.remote_addr,
            "body": data,
            "headers": dict(request.headers)
        }))

    @app.after_request
    def log_response_info(response):
        MAX_LOG_LENGTH = 1000
        
        duration = (datetime.utcnow() - g.start_time).total_seconds()
        try:
            body = response.get_data(as_text=True)
            
            if len(body) > MAX_LOG_LENGTH:
                body = body[:MAX_LOG_LENGTH] + "… [truncated]"
        except Exception:
            body = "<unreadable>"

        logger.info(json.dumps({
            "type": "response",
            "method": request.method,
            "path": request.path,
            "status": response.status_code,
            "duration": f"{duration:.4f}s",
            "body": body
        }))
        
        return response

    # Global error handler
    @app.errorhandler(Exception)
    def handle_exception(e):
        logger.exception(f"Unhandled exception occurred: {str(e)}")
        return {"error": "Internal server error"}, 500

    scheduler = BackgroundScheduler()
    scheduler.add_job(train_all_users, "cron", minute="*/2")  # Every 2 minutes
    scheduler.start()
    
    return app
