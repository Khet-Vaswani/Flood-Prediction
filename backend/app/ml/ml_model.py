import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from app.config import settings

def generate_synthetic_data(num_samples=1000):
    """
    Generates synthetic flood risk historical data representing Pakistan conditions.
    Features:
    - rainfall_24h_mm: 0 to 300 mm
    - elevation_m: 5m to 2000m (low-lying Sindh/Punjab plains vs mountainous areas)
    - river_distance_km: 0.1km to 50km
    - soil_moisture: 0.0 to 1.0 (saturation index)
    """
    np.random.seed(42)
    
    rainfall = np.random.uniform(0, 300, num_samples)
    elevation = np.random.uniform(5, 2000, num_samples)
    river_dist = np.random.uniform(0.1, 50, num_samples)
    soil_moist = np.random.uniform(0.1, 0.9, num_samples)
    
    # Simple rule-based scoring to generate target class (1: flooded, 0: safe)
    # Higher rainfall, lower elevation, closer river, higher soil moisture = higher risk
    score = (
        (rainfall / 100.0) * 2.0 
        - (elevation / 500.0) 
        - (river_dist / 10.0) 
        + (soil_moist * 1.5)
    )
    
    # Normalize score and map to binary target with some random noise
    prob = 1.0 / (1.0 + np.exp(-score))
    flooded = (prob + np.random.normal(0, 0.1, num_samples) > 0.55).astype(int)
    
    df = pd.DataFrame({
        'rainfall_24h_mm': rainfall,
        'elevation_m': elevation,
        'river_distance_km': river_dist,
        'soil_moisture': soil_moist,
        'flooded': flooded
    })
    return df

def train_and_save_model():
    """Trains a Random Forest classifier and dumps it to disk."""
    print("AI Engine: Training new flood prediction model on synthetic data...")
    df = generate_synthetic_data()
    X = df[['rainfall_24h_mm', 'elevation_m', 'river_distance_km', 'soil_moisture']]
    y = df['flooded']
    
    model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    model.fit(X, y)
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(settings.MODEL_PATH), exist_ok=True)
    joblib.dump(model, settings.MODEL_PATH)
    print(f"AI Engine: Model saved successfully to {settings.MODEL_PATH}")
    return model

def get_model():
    """Loads the model, training it first if not present."""
    if not os.path.exists(settings.MODEL_PATH):
        return train_and_save_model()
    try:
        return joblib.load(settings.MODEL_PATH)
    except Exception as e:
        print(f"AI Engine Error loading model: {e}. Retraining...")
        return train_and_save_model()

def predict_flood_risk(rainfall_24h_mm: float, elevation_m: float, river_distance_km: float, soil_moisture: float):
    """
    Predicts probability of flooding and classifies risk level.
    """
    model = get_model()
    features = pd.DataFrame([{
        'rainfall_24h_mm': rainfall_24h_mm,
        'elevation_m': elevation_m,
        'river_distance_km': river_distance_km,
        'soil_moisture': soil_moisture
    }])
    
    # Get probability of class 1 (flooded)
    prob_arr = model.predict_proba(features)
    prob = float(prob_arr[0][1] * 100) # Convert to percentage
    
    # Classify Risk Level
    if prob < 25:
        risk_level = "Low"
        rec = "Weather conditions are stable. Continue to monitor local forecasts regularly."
    elif prob < 50:
        risk_level = "Medium"
        rec = "Moderate risk. Keep clean water and emergency kits ready, clear localized drainage lines."
    elif prob < 75:
        risk_level = "High"
        rec = "High risk! Prepare for potential evacuation, pack valuable documents, and listen to official NDMA warnings."
    else:
        risk_level = "Critical"
        rec = "CRITICAL FLOOD RISK! Immediate evacuation via safe routes is strongly advised. Move to highest ground."
        
    # Analyze rainfall pattern description
    if rainfall_24h_mm < 20:
        pattern = "Light rain / drizzle. No immediate storm threats."
    elif rainfall_24h_mm < 70:
        pattern = "Moderate rainfall. Localized pooling possible on roads."
    elif rainfall_24h_mm < 150:
        pattern = "Heavy monsoonal rains. Significant water volume entering rivers."
    else:
        pattern = "Extreme cloudburst or torrential monsoonal downpour. Flash flooding highly probable."
        
    return {
        "flood_probability": round(prob, 2),
        "risk_level": risk_level,
        "rainfall_pattern": pattern,
        "mitigation_recommendation": rec
    }
