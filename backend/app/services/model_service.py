import os
import numpy as np
import joblib
from sklearn.linear_model import SGDClassifier
from app.db import SessionLocal
from app.config import Config
from app.utils.logger import setup_logger
from app.models import TrainingSample

logger = setup_logger(__name__)

def train_and_save_model():
    try:
        logger.info("[Trainer] Starting model training...")

        db = SessionLocal()

        new_samples = db.query(TrainingSample).filter(TrainingSample.trained == False).all()

        if not new_samples:
            logger.info("No new training data.")
            db.close()
            return
        
        data_by_user = {}
        for s in new_samples:
            data_by_user.setdefault(s.email, []).append(s.to_dict())

        for email, positive_samples in data_by_user.items():
            negative_samples = []
            for other_emails, samples in data_by_user.items():
                if other_emails != email:
                    negative_samples.extend(samples)
            build_or_update_model(email, positive_samples, negative_samples)
            
        trained_ids = [sample.id for sample in new_samples]
        
        db.query(TrainingSample).filter(TrainingSample.id.in_(trained_ids)).update(
            {TrainingSample.trained: True},
            synchronize_session=False
        )
        db.commit()
        db.close()

        logger.info(f"[Trainer] Trained on {len(trained_ids)} new samples.")
    except Exception as e:
        logger.info(f"[Trainer] Exception during training: {str(e)}")
        

def load_model(email):
    model_complete_path = os.path.join(Config.MODEL_PATH, f"{email.split('@')[0]}.pkl")
    if not os.path.exists(model_complete_path):
        logger.info(f"Model not found at '{model_complete_path}', training a new model.")
        model = SGDClassifier(loss="log_loss")
        joblib.dump(model, model_complete_path)
        
    return joblib.load(model_complete_path)

def flatten_features(sample):
    return [
        np.mean(sample.get("hold_time", []) or [0]),
        np.std(sample.get("hold_time", []) or [0]),
        np.mean(sample.get("flight_time", []) or [0]),
        np.std(sample.get("flight_time", []) or [0]),
        np.mean(sample.get("mouse_velocity", []) or [0]),
        np.std(sample.get("mouse_velocity", []) or [0]),
        np.mean(sample.get("click_frequency", []) or [0]),
        np.std(sample.get("click_frequency", []) or [0]),
    ]

def build_or_update_model(email, positive_samples, negative_samples):
    model_complete_path = os.path.join(Config.MODEL_PATH, f"{email.split('@')[0]}.pkl")
    if os.path.exists(model_complete_path):
        model = joblib.load(model_complete_path)
        logger.info("Updating existing model...")
    else:
        model = SGDClassifier(loss="log_loss")
        logger.info(f"Creating new model at {model_complete_path}")

    X = []
    y = []

    for sample in positive_samples:
        X.append(flatten_features(sample))
        y.append(1)  # Genuine

    for sample in negative_samples:
        X.append(flatten_features(sample))
        y.append(0)  # Impostor
    
    X = np.array(X)
    y = np.array(y)

    model.partial_fit(X, y, classes=[0, 1])
    joblib.dump(model, model_complete_path)
    return model

def predict_user(email, sample):
    model_path = os.path.join(Config.MODEL_PATH, f"{email.split('@')[0]}.pkl")
    
    if not os.path.exists(model_path):
        return 0.0
    
    try:
        model = joblib.load(model_path)
        features = flatten_features(sample)
        X = np.array([features])
        
        if hasattr(model, "predict_proba"):
            confidence = model.predict_proba(X)[0][1]
        else:
            confidence = model.decision_function(X)[0]
            confidence = 1 / (1 + np.exp(-confidence))

        return confidence
    except Exception as e:
        logger.info(f"[PREDICT USER]: Error in predict_user for {email}: {e}")
        return 0.0

def store_metrics_for_training(email, metrics):
    if not email or not metrics:
        logger.info(f"Email {email} or Metrics {metrics} are missing, not storing training data.")
        return {"stored": False}

    db = SessionLocal()
    sample = TrainingSample(
        email=email,
        hold_time=metrics.get("hold_time"),
        flight_time=metrics.get("flight_time"),
        mouse_velocity=metrics.get("mouse_velocity"),
        click_frequency=metrics.get("click_frequency"),
    )
    db.add(sample)
    db.commit()
    db.close()

    logger.info(f"Stored training data for {email}")
    return {"stored": True}

def compute_fitness(biometric_score, ip_score):
    return float(Config.BIOMETRICS_WEIGHT) * biometric_score + float(Config.IP_WEIGHT) * ip_score