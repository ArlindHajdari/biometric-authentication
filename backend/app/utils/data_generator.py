import numpy as np

def generate_synthetic_data():
    legit = np.random.normal(loc=[0.15, 0.10, 0.5, 1.0], scale=0.02, size=(100, 4))
    impostor = np.random.normal(loc=[0.25, 0.18, 0.9, 2.0], scale=0.03, size=(100, 4))
    X = np.vstack((legit, impostor))
    y = np.concatenate((np.ones(100), np.zeros(100)))
    return X, y
