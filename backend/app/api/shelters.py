import math
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.db.models import Shelter, User
from app.schemas import ShelterCreate, ShelterUpdate, ShelterResponse
from app.auth import get_current_user, RoleChecker

router = APIRouter(prefix="/shelters", tags=["Emergency Shelters"])

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # Earth radius in kilometers
    R = 6371.0
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (math.sin(dlat / 2) ** 2 + 
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

@router.post("/", response_model=ShelterResponse, status_code=status.HTTP_201_CREATED)
def create_shelter(
    shelter_in: ShelterCreate, 
    current_user: User = Depends(RoleChecker(["admin"])), 
    db: Session = Depends(get_db)
):
    new_shelter = Shelter(
        name=shelter_in.name,
        latitude=shelter_in.latitude,
        longitude=shelter_in.longitude,
        capacity=shelter_in.capacity,
        current_occupancy=shelter_in.current_occupancy,
        status=shelter_in.status,
        contact_number=shelter_in.contact_number
    )
    db.add(new_shelter)
    db.commit()
    db.refresh(new_shelter)
    return new_shelter

@router.get("/", response_model=List[ShelterResponse])
def list_shelters(db: Session = Depends(get_db)):
    return db.query(Shelter).all()

@router.get("/nearest", response_model=List[ShelterResponse])
def get_nearest_shelters(latitude: float, longitude: float, limit: int = 5, db: Session = Depends(get_db)):
    shelters = db.query(Shelter).filter(Shelter.status == "open").all()
    
    # Calculate distance for each shelter
    results = []
    for s in shelters:
        dist = haversine_distance(latitude, longitude, s.latitude, s.longitude)
        
        # Serialize to schema compatible format with dynamic attribute
        s_dict = {
            "id": s.id,
            "name": s.name,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "capacity": s.capacity,
            "current_occupancy": s.current_occupancy,
            "status": s.status,
            "contact_number": s.contact_number,
            "created_at": s.created_at,
            "distance_km": round(dist, 2)
        }
        results.append(s_dict)
        
    # Sort by distance
    results.sort(key=lambda x: x["distance_km"])
    return results[:limit]

@router.put("/{id}", response_model=ShelterResponse)
def update_shelter(
    id: str,
    shelter_in: ShelterUpdate,
    current_user: User = Depends(RoleChecker(["admin", "rescue_team"])),
    db: Session = Depends(get_db)
):
    shelter = db.query(Shelter).filter(Shelter.id == id).first()
    if not shelter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shelter not found"
        )
        
    for field, val in shelter_in.model_dump(exclude_unset=True).items():
        setattr(shelter, field, val)
        
    db.commit()
    db.refresh(shelter)
    return shelter
