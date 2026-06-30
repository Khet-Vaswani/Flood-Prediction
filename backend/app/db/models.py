import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="citizen") # citizen, admin, rescue_team
    phone_number = Column(String(20), unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    reports = relationship("Report", back_populates="citizen", foreign_keys="Report.citizen_id")
    tasks = relationship("RescueTask", back_populates="assigned_team", foreign_keys="RescueTask.assigned_team_id")

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    citizen_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(20), nullable=False) # low, medium, high, critical
    status = Column(String(20), default="pending") # pending, verified, resolved, rejected
    image_url = Column(String(500), nullable=True)
    verified_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    citizen = relationship("User", back_populates="reports", foreign_keys=[citizen_id])
    rescue_task = relationship("RescueTask", back_populates="report", uselist=False)

class Shelter(Base):
    __tablename__ = "shelters"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity = Column(Integer, nullable=False)
    current_occupancy = Column(Integer, default=0)
    status = Column(String(20), default="open") # open, full, closed
    contact_number = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    risk_level = Column(String(20), nullable=False) # green, yellow, orange, red
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius_km = Column(Float, default=10.0)
    boundary_coordinates = Column(Text, nullable=True) # JSON representation of polygon coordinates for custom bounds
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

class WeatherReading(Base):
    __tablename__ = "weather_readings"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    city = Column(String(100), nullable=False, index=True)
    temperature = Column(Float, nullable=True)
    rainfall_mm = Column(Float, default=0.0)
    humidity = Column(Integer, nullable=True)
    wind_speed = Column(Float, nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow)

class RescueTask(Base):
    __tablename__ = "rescue_tasks"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    report_id = Column(String(36), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False)
    assigned_team_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(20), default="assigned") # assigned, active, completed
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    report = relationship("Report", back_populates="rescue_task")
    assigned_team = relationship("User", back_populates="tasks", foreign_keys=[assigned_team_id])
