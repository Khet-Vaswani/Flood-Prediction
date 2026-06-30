import math
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.db.models import Alert, User
from app.schemas import AlertCreate, AlertResponse
from app.auth import get_current_user, RoleChecker

router = APIRouter(prefix="/alerts", tags=["Emergency Alerts"])

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 + 
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@router.post("/", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
def create_alert(
    alert_in: AlertCreate, 
    current_user: User = Depends(RoleChecker(["admin"])), 
    db: Session = Depends(get_db)
):
    new_alert = Alert(
        title=alert_in.title,
        message=alert_in.message,
        risk_level=alert_in.risk_level,
        latitude=alert_in.latitude,
        longitude=alert_in.longitude,
        radius_km=alert_in.radius_km,
        boundary_coordinates=alert_in.boundary_coordinates,
        expires_at=alert_in.expires_at,
        active=True
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return new_alert

@router.get("/", response_model=List[AlertResponse])
def list_all_alerts(db: Session = Depends(get_db)):
    return db.query(Alert).all()

@router.get("/active", response_model=List[AlertResponse])
def get_active_alerts(latitude: Optional[float] = None, longitude: Optional[float] = None, db: Session = Depends(get_db)):
    now = datetime.utcnow()
    query = db.query(Alert).filter(Alert.active == True)
    
    # Filter out expired alerts
    alerts = query.filter((Alert.expires_at == None) | (Alert.expires_at > now)).all()
    
    if latitude is not None and longitude is not None:
        affected_alerts = []
        for alert in alerts:
            dist = haversine_distance(latitude, longitude, alert.latitude, alert.longitude)
            if dist <= alert.radius_km:
                affected_alerts.append(alert)
        return affected_alerts
        
    return alerts
