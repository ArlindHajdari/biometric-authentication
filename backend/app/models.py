from sqlalchemy import Column, String, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
import uuid

Base = declarative_base()
class User(Base):
    __tablename__ = "users"
    email = Column(String, primary_key=True)
    password = Column(String)
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

