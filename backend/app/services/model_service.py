import os
import numpy as np
from joblib import dump, load
from app.db import SessionLocal
from sqlalchemy.orm import Session
from app.config import Config
from app.utils.logger import setup_logger
from app.models import TrainingSample
from sklearn.svm import OneClassSVM
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

logger = setup_logger()

def load_model(email):
    model_complete_path = os.path.join(Config.MODEL_PATH, f"{email.split('@')[0]}.pkl")
    if os.path.exists(model_complete_path):
        logger.info(f"Model loaded from: '{model_complete_path}'")
        return load(model_complete_path)
    return None

def save_model(email: str, model):
    path = os.path.join(Config.MODEL_PATH, f"{email.split('@')[0]}.pkl")
    dump(model, path)
    
def flatten_features(sample):
    return [
        np.mean(sample.get("hold_time", []) or [0]),
        np.mean(sample.get("flight_time", []) or [0]),
        np.mean(sample.get("mouse_velocity", []) or [0]),
        np.mean(sample.get("click_frequency", []) or [0]),
        np.mean(sample.get("dwell_time", []) or [0]),
        np.mean(sample.get("scroll_distance", []) or [0]),
        np.mean(sample.get("keypress_rate", []) or [0]),
        np.mean(sample.get("cursor_variation", []) or [0]),
    ]

def fetch_training_data_by_email(session: Session, email: str):
    try:
        samples = session.query(TrainingSample).filter_by(email=email, trained="False").all()
        if not samples:
            return None, []

        X = []
        samples_id = []
        
        for sample in samples:
            X.append(flatten_features(sample.to_dict()))
            samples_id.append(sample.id)

        return np.array(X), samples_id
    except Exception as e:
        logger.error(f"[fetch_training_data_by_email]: Error fetching data for {email}: {e}")
        return None, []
    finally:
        session.close()

def mark_samples_as_trained(session: Session, samples):
    if not samples:
        return
    
    session.query(TrainingSample).filter(TrainingSample.id.in_(samples)).update(
        {"trained": "True"}, synchronize_session=False
    )
    session.commit()

def train_or_update_model(email: str, X_raw: np.ndarray, incremental: bool = True) -> bool:
    if X_raw.shape[0] < Config.MIN_SAMPLES_REQUIRED:
        logger.error(f"Not enough data ({X_raw.shape[0]}) to train for {email}. Skipping.")
        return False

    model_path = os.path.join(Config.MODEL_PATH, f"{email.split('@')[0]}.pkl")

    try:
        if incremental and os.path.exists(model_path):
            old_model = load(model_path)
            existing_X = getattr(old_model, "X_train_", None)
            if existing_X is not None:
                X_raw = np.vstack([existing_X, X_raw])
                
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X_raw)

        kmeans = KMeans(n_clusters=1, random_state=42)
        cluster_center = kmeans.fit(X_scaled).cluster_centers_
        
        all_distances = np.linalg.norm(X_scaled - cluster_center, axis=1)
        D_max = np.mean(all_distances) + 2 * np.std(all_distances)

        clf = OneClassSVM(kernel='rbf', gamma='scale', nu=0.1)
        clf.fit(X_scaled)

        clf.X_train_ = X_raw
        clf.scaler_ = scaler
        clf.cluster_center_ = cluster_center
        clf.cluster_distance_max_ = D_max

        save_model(email, clf)
        logger.info(f"[train_or_update_model] Model for {email} trained on {len(X_raw)} samples.")
        return True

    except Exception as e:
        logger.error(f"[train_or_update_model]: Training failed for {email}: {e}")
        return False

def train_all_users():
    session = SessionLocal()
    try:
        emails = session.query(TrainingSample.email).distinct().all()
        for (email,) in emails:
            X_raw, samples = fetch_training_data_by_email(session, email)
            if X_raw is not None:
                success = train_or_update_model(email, X_raw)
                if success:
                    mark_samples_as_trained(session, samples)
    except Exception as e:
        logger.error(f"[train_all_users]: Training failed for {email}: {e}")
    finally:
        session.close()

def predict_user_authenticity(email: str, metrics: dict[str, list[float]]) -> bool:
    model = load_model(email)
    if not model:
        logger.info(f"No model found for {email}. Training data will be stored for future training.")
        return False

    required_keys = ["hold_time", "flight_time", "mouse_velocity", "click_frequency", "dwell_time", "scroll_distance", "keypress_rate", "cursor_variation"]
    features = []

    for key in required_keys:
        values = metrics.get(key, [])
        if not isinstance(values, list):
            raise ValueError(f"Invalid metric: {key} must be a list")
        if not values:
            features.append(0.0)
        else:
            features.append(float(np.mean(values))) 

    X_input = np.array(features).reshape(1, -1)

    if hasattr(model, "scaler_"):
        X_input = model.scaler_.transform(X_input)

    prediction = model.predict(X_input)[0]
    svm_score = 1.0 if prediction == 1 else 0.0
    
    if hasattr(model, "cluster_center_"):
        distance = np.linalg.norm(X_input - model.cluster_center_)
        logger.info(f"[predict_user_authenticity] Distance to centroid: {distance:.4f}")

        D_max = getattr(model, "cluster_distance_max_", 3.0)
        distance_score = max(0.0, 1.0 - (distance / D_max))
    else:
        distance_score = 0.0

    w_svm = float(Config.SVM_WEIGHT)
    w_dist = float(Config.CLUSTER_WEIGHT)
    fitness = w_svm * svm_score + w_dist * distance_score

    logger.info(f"[predict_user_authenticity] SVM={svm_score}, Distance_Score={distance_score:.4f}, Fitness={fitness:.4f}")
    return prediction == 1 

def store_metrics_for_training(email, metrics):
    if not email or not metrics:
        logger.info(f"Email {email} or Metrics {metrics} are missing, not storing training data.")
        return {"stored": False}
    
    metric_keys = ["hold_time", "flight_time", "mouse_velocity", "click_frequency", "dwell_time", "scroll_distance", "keypress_rate", "cursor_variation"]
    if all((not metrics.get(key)) or (isinstance(metrics.get(key), list) and len(metrics.get(key)) == 0) for key in metric_keys):
        logger.info(f"All metrics are empty for {email}, not storing training data.")
        return {"stored": False}

    db = SessionLocal()
    sample = TrainingSample(
        email=email,
        hold_time=metrics.get("hold_time"),
        flight_time=metrics.get("flight_time"),
        mouse_velocity=metrics.get("mouse_velocity"),
        click_frequency=metrics.get("click_frequency"),
        dwell_time=metrics.get("dwell_time", []),
        scroll_distance=metrics.get("scroll_distance", []),
        keypress_rate=metrics.get("keypress_rate", []),
        cursor_variation=metrics.get("cursor_variation", []),
    )
    db.add(sample)
    db.commit()
    db.close()

    logger.info(f"Stored training data for {email}")
    return {"stored": True}

def compute_fitness(is_genuine, ip_score):
    return float(Config.BIOMETRICS_WEIGHT) * (1.0 if is_genuine else 0.0) + float(Config.IP_WEIGHT) * ip_score
