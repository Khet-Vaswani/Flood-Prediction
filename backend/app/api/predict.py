from fastapi import APIRouter, Depends, HTTPException
from app.schemas import PredictionInput, PredictionResponse
from app.ml.ml_model import predict_flood_risk
from app.auth import get_current_user
from app.db.models import User

router = APIRouter(prefix="/predict", tags=["AI Prediction"])

@router.post("/", response_model=PredictionResponse)
def get_prediction(input_data: PredictionInput, current_user: User = Depends(get_current_user)):
    try:
        prediction = predict_flood_risk(
            rainfall_24h_mm=input_data.rainfall_24h_mm,
            elevation_m=input_data.elevation_m,
            river_distance_km=input_data.river_distance_km,
            soil_moisture=input_data.soil_moisture
        )
        return prediction
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error running flood risk prediction: {str(e)}"
        )
