import os
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from app.utils.data_generator import generate_synthetic_data
from app.config import Config

def train_and_save_model():
    X, y = generate_synthetic_data()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)

    os.makedirs(os.path.dirname(Config.MODEL_PATH), exist_ok=True)
    joblib.dump(clf, Config.MODEL_PATH)
    print(f"[INFO] Model trained and saved to '{Config.MODEL_PATH}'")

def load_model():
    if not os.path.exists(Config.MODEL_PATH):
        train_and_save_model()
    return joblib.load(Config.MODEL_PATH)

def predict_user(model, data):
    features = np.array([[float(data["hold_time"]),
                          float(data["flight_time"]),
                          float(data["mouse_velocity"]),
                          float(data["click_frequency"])]])
    prediction = model.predict(features)[0]
    confidence = model.predict_proba(features)[0][int(prediction)]
    return {
        "authenticated": bool(prediction),
        "confidence": round(confidence, 4)
    }
