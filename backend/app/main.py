import asyncio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.db.database import engine, Base
from app.api import auth, reports, shelters, alerts, predict, chat
from app.tasks.weather_tasks import weather_sync_loop

# Automatically create database tables if they do not exist
try:
    Base.metadata.create_all(bind=engine)
    print("Database connection check: Tables initialized successfully.")
except Exception as e:
    print(f"Database connection error: {e}. SQLite/fallback engine will be initialized locally.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configure CORS Middleware
# Allows Next.js frontend (typically port 3000) to communicate with FastAPI (typically port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, lock this down to the specific domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handling utility
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
    )

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(shelters.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(predict.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def startup_event():
    # Start the weather updates background worker task
    asyncio.create_task(weather_sync_loop())

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "AI-Powered Flood Prediction and Emergency Response System API is fully operational.",
        "docs_url": "/docs"
    }
