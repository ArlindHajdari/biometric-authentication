import bcrypt

def hash_password(plain_password):
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password, hashed):
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed.encode("utf-8"))
