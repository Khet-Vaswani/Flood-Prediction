from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import pandas as pd
import io
from app.schemas import PredictionInput, PredictionResponse
from app.ml.ml_model import predict_flood_risk, retrain_model
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

@router.post("/retrain")
async def trigger_model_retrain(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    # Verify user role is admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Only administrators can access the AI ML model retraining suite."
        )
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        metrics = retrain_model(df)
        return metrics
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error during retraining: {str(e)}. Please check your CSV column naming and records count."
        )
