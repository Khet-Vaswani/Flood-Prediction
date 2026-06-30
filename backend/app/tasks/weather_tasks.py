import httpx
import asyncio
import random
from datetime import datetime
from sqlalchemy.orm import Session
from app.config import settings
from app.db.database import SessionLocal
from app.db.models import WeatherReading

CITIES_OF_INTEREST = [
    "Islamabad",
    "Lahore",
    "Karachi",
    "Peshawar",
    "Quetta",
    "Gilgit",
    "Sukkur",
    "Nowshera",
    "Muzaffargarh",
    "Badin"
]

async def fetch_weather_for_city(city: str, db: Session):
    """
    Fetches real-time weather from OpenWeather or simulates it if API key is not configured.
    """
    temperature = 25.0
    rainfall_mm = 0.0
    humidity = 60
    wind_speed = 5.0
    
    if settings.OPENWEATHER_API_KEY:
        try:
            url = f"https://api.openweathermap.org/data/2.5/weather?q={city},PK&appid={settings.OPENWEATHER_API_KEY}&units=metric"
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, timeout=10.0)
                if resp.status_code == 200:
                    data = resp.json()
                    temperature = data["main"]["temp"]
                    humidity = data["main"]["humidity"]
                    wind_speed = data["wind"]["speed"]
                    
                    # OpenWeather rain is optional, structure is data["rain"]["1h"]
                    if "rain" in data:
                        rainfall_mm = data["rain"].get("1h", data["rain"].get("3h", 0.0))
        except Exception as e:
            print(f"Weather Task: Error calling OpenWeather API for {city}: {e}. Falling back to simulation.")
            settings.OPENWEATHER_API_KEY = "" # Force simulation for subsequent tries this round
            
    # Simulation Fallback
    if not settings.OPENWEATHER_API_KEY:
        # Generate weather conditions based on monsoon season profiles
        temperature = round(random.uniform(26.0, 39.0), 1)
        humidity = random.randint(45, 95)
        wind_speed = round(random.uniform(2.0, 18.0), 1)
        
        # 30% chance of rain, higher in historically wet regions
        rain_prob = 0.35 if city in ["Islamabad", "Nowshera", "Peshawar", "Muzaffargarh"] else 0.15
        if random.random() < rain_prob:
            # Simulate a downpour scale (heavy rains in monsoon)
            rainfall_mm = round(random.uniform(5.0, 110.0), 1)
        else:
            rainfall_mm = 0.0
            
    # Write reading to Database
    new_reading = WeatherReading(
        city=city,
        temperature=temperature,
        rainfall_mm=rainfall_mm,
        humidity=humidity,
        wind_speed=wind_speed,
        recorded_at=datetime.utcnow()
    )
    db.add(new_reading)
    db.commit()
    return new_reading

async def weather_sync_loop():
    """Periodic task loop to sync weather metrics."""
    print("Weather Sync Task: Background worker started.")
    while True:
        db = SessionLocal()
        try:
            print(f"Weather Sync Task: Syncing weather at {datetime.now()}")
            for city in CITIES_OF_INTEREST:
                await fetch_weather_for_city(city, db)
                await asyncio.sleep(1) # rate limit API calls politely
            print("Weather Sync Task: Weather sync completed.")
        except Exception as e:
            print(f"Weather Sync Task: Exception encountered: {e}")
        finally:
            db.close()
            
        # Sleep for 15 minutes before the next pull
        await asyncio.sleep(900)
