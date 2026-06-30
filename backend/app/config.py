import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Powered Flood Prediction & Emergency Response System"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("JWT_SECRET", "super-secret-key-for-pakistan-flood-prediction-2026")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost:3306/flood_db")

    
    # Third Party APIs (optional, fallback to mock if empty)
    # pyrefly: ignore [parse-error]
    OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "")
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_FROM_NUMBER: str = os.getenv("TWILIO_FROM_NUMBER", "")
    
    # Models
    MODEL_PATH: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "app", "ml", "flood_model.joblib")

    class Config:
        case_sensitive = True

# pyrefly: ignore [parse-error]
settings = Settings()
