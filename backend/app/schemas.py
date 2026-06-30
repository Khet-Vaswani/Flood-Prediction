from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# --- Auth Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone_number: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: str = Field(default="citizen", description="citizen, admin, rescue_team")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    email: str
    name: str

class UserResponse(UserBase):
    id: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Incident Report Schemas ---
class ReportCreate(BaseModel):
    latitude: float
    longitude: float
    description: str
    severity: str = Field(..., description="low, medium, high, critical")
    image_url: Optional[str] = None

class ReportVerify(BaseModel):
    status: str = Field(..., description="verified, resolved, rejected")
    assign_team_id: Optional[str] = None

class RescueTaskResponse(BaseModel):
    id: str
    assigned_team_id: Optional[str] = None
    assigned_team_name: Optional[str] = None
    status: str
    notes: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True

class ReportResponse(BaseModel):
    id: str
    citizen_id: Optional[str] = None
    citizen_name: Optional[str] = None
    latitude: float
    longitude: float
    description: str
    severity: str
    status: str
    image_url: Optional[str] = None
    verified_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    rescue_task: Optional[RescueTaskResponse] = None

    class Config:
        from_attributes = True

# --- Shelter Schemas ---
class ShelterCreate(BaseModel):
    name: str
    latitude: float
    longitude: float
    capacity: int
    current_occupancy: int = 0
    status: str = "open"
    contact_number: Optional[str] = None

class ShelterUpdate(BaseModel):
    capacity: Optional[int] = None
    current_occupancy: Optional[int] = None
    status: Optional[str] = None
    contact_number: Optional[str] = None

class ShelterResponse(ShelterCreate):
    id: str
    created_at: datetime
    distance_km: Optional[float] = None

    class Config:
        from_attributes = True

# --- Alert Schemas ---
class AlertCreate(BaseModel):
    title: str
    message: str
    risk_level: str = Field(..., description="green, yellow, orange, red")
    latitude: float
    longitude: float
    radius_km: float = 10.0
    boundary_coordinates: Optional[str] = None
    expires_at: Optional[datetime] = None

class AlertResponse(AlertCreate):
    id: str
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- AI Model Schemas ---
class PredictionInput(BaseModel):
    latitude: float
    longitude: float
    rainfall_24h_mm: float
    elevation_m: float
    river_distance_km: float
    soil_moisture: float = Field(default=0.4, description="Index from 0.0 to 1.0")

class PredictionResponse(BaseModel):
    flood_probability: float = Field(..., description="Percentage value between 0.0 and 100.0")
    risk_level: str = Field(..., description="Low, Medium, High, Critical")
    rainfall_pattern: str
    mitigation_recommendation: str

# --- Chatbot Schemas ---
class ChatInput(BaseModel):
    message: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ChatResponse(BaseModel):
    reply: str
    safety_tips: List[str]
    emergency_contacts: List[dict]
