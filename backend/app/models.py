from sqlalchemy import Column, String, JSON, DateTime, Integer, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

Base = declarative_base()
class User(Base):
    __tablename__ = "users"
    email = Column(String, primary_key=True)
    password = Column(String)
    mode = Column(String, default="train")
    successful_logins = Column(Integer, default=0) 
    created_at = Column(DateTime, default=datetime.utcnow)
    
class TrainingSample(Base):
    __tablename__ = "training_samples"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, nullable=False)
    hold_time = Column(JSON)
    flight_time = Column(JSON)
    mouse_velocity = Column(JSON)
    click_frequency = Column(JSON)
    trained = Column(String, default="False")
    
    def to_dict(self):
        return {
            "email": self.email,
            "hold_time": self.hold_time,
            "flight_time": self.flight_time,
            "mouse_velocity": self.mouse_velocity,
            "click_frequency": self.click_frequency,
            "trained": self.trained
        }

class IPTrustRequest(Base):
    __tablename__ = "ip_trust_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, nullable=False)
    ip_address = Column(String, nullable=False)
    requested_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    confirmed = Column(Boolean, default=False)

    def is_expired(self):
        return datetime.utcnow() > self.expires_at
    
class UserIP(Base):
    __tablename__ = "user_ips"

    email = Column(String, primary_key=True)
    ip_address = Column(String, primary_key=True)
    successful_logins = Column(Integer, default=0)
    last_seen = Column(DateTime, default=datetime.utcnow)