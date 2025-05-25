import os
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from app.db import SessionLocal
from app.config import Config
from app.utils.logger import setup_logger
from app.models import TrainingSample

logger = setup_logger(__name__)

def train_and_save_model():
    try:
        logger.info("[Trainer] Starting model training...")

        db = SessionLocal()

        # Only fetch untrained samples
        new_samples = db.query(TrainingSample).filter(TrainingSample.trained == False).all()

        data_by_user = {}
        trained_ids = []

        for sample in new_samples:
            if sample.email not in data_by_user:
                data_by_user[sample.email] = []
            data_by_user[sample.email].append(sample.to_dict())
            trained_ids.append(sample.id)

        if not data_by_user:
            logger.info("No new training data.")
            db.close()
            return

        model = build_model(data_by_user)
        joblib.dump(model, Config.MODEL_PATH)

        # Mark these samples as used
        db.query(TrainingSample).filter(TrainingSample.id.in_(trained_ids)).update(
            {TrainingSample.trained: True},
            synchronize_session=False
        )
        db.commit()
        db.close()

        logger.info(f"[Trainer] Trained on {len(trained_ids)} new samples.")
    except Exception as e:
        logger.info(f"[Trainer] Exception during training: {str(e)}")
        

def load_model():
    if not os.path.exists(Config.MODEL_PATH):
        logger.info(f"Model not found at '{Config.MODEL_PATH}', training a new model.")
        train_and_save_model()
    return joblib.load(Config.MODEL_PATH)

def flatten_features(sample):
    """Convert raw metric arrays to flattened numeric features."""
    return [
        np.mean(sample.get("hold_time", []) or [0]),
        np.mean(sample.get("flight_time", []) or [0]),
        np.mean(sample.get("mouse_velocity", []) or [0]),
        np.mean(sample.get("click_frequency", []) or [0]),
    ]

def build_model(data_by_user):
    X = []
    y = []

    for email, samples in data_by_user.items():
        for sample in samples:
            features = flatten_features(sample)
            X.append(features)
            y.append(email)  # Label = email (user ID)

    clf = RandomForestClassifier(n_estimators=100)
    clf.fit(X, y)
    return clf

def predict_user(model, data):
    features = np.array([[float(data["hold_time"]),
                          float(data["flight_time"]),
                          float(data["mouse_velocity"]),
                          float(data["click_frequency"])]])
    prediction = model.predict(features)[0]
    confidence = model.predict_proba(features)[0][int(prediction)]
    
    logger.info(f"Prediction: {prediction}, Confidence: {confidence}")
    
    return {
        "authenticated": bool(prediction),
        "confidence": round(confidence, 4)
    }

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