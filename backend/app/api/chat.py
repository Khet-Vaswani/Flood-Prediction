from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import google.generativeai as genai

from app.schemas import ChatInput, ChatResponse
from app.db.database import get_db
from app.db.models import WeatherReading, Alert, Shelter
from app.config import settings

router = APIRouter(prefix="/chat", tags=["AI Emergency Chatbot"])

EMERGENCY_CONTACTS = [
    {"name": "National Disaster Management Authority (NDMA)", "number": "1189"},
    {"name": "Rescue Emergency Helpline (Punjab/KP/Balochistan)", "number": "1122"},
    {"name": "PDMA Sindh Emergency Cell", "number": "021-99332007"},
    {"name": "Edhi Ambulance Service", "number": "115"},
    {"name": "Chhipa Ambulance & Welfare", "number": "1020"},
    {"name": "Pakistan Meteorological Department (PMD)", "number": "051-9250360"}
]

SAFETY_TIPS_GENERAL = [
    "Secure your home: turn off main electricity breakers, gas valves, and water inlets.",
    "Elevate critical household appliances and furniture onto tables or upper floors.",
    "Prepare an emergency go-bag: clean drinking water, high-calorie dry food, dry clothes, first-aid kit, flashlights, and identification documents.",
    "Do not walk, swim, or drive through moving floodwaters. Just 6 inches of moving water can knock you down, and 2 feet can sweep a car away.",
    "Move to the highest level of the building if trapped. Avoid attics without roof exits to prevent being trapped by rising water."
]

def formulate_fallback_reply(message: str) -> dict:
    msg_lower = message.lower()
    reply = ""
    tips = []
    
    if any(k in msg_lower for k in ["rescue", "save", "trapped", "stuck", "emergency", "drowning", "help me"]):
        reply = (
            "We have flagged this as an EMERGENCY. If you or someone else is in immediate danger of rising waters, "
            "please contact the emergency helplines immediately. "
            "If you register this on our crowdsourced incidents map, local NDMA staff and rescue squads will receive your exact coordinates."
        )
        tips = [
            "Call 1122 (Rescue) or 1189 (NDMA) immediately from your phone.",
            "Stay on high ground. If you are inside a building, climb to the roof if possible. Do NOT enter attics as you could get trapped.",
            "Signal rescuers using a bright cloth, whistle, or flashlight.",
            "Stay clear of electrical wires, submerged poles, and power outlets."
        ]
    elif any(k in msg_lower for k in ["evacuate", "leave", "route", "road", "safe way", "escape"]):
        reply = (
            "During an active flood event, check the live Flood Risk Map on our portal to locate officially designated safe evacuation corridors. "
            "Only use routes recommended by NDMA or provincial authorities. Avoid shortcuts, as they may lead to flooded drainage canals or collapsed bridges."
        )
        tips = [
            "Follow official evacuation orders immediately when issued.",
            "Travel during daylight hours to avoid unseen road washouts and debris.",
            "Wear sturdy boots and long trousers to protect against waterborne debris and contaminants.",
            "Check in at your nearest registered relief camp/shelter so rescue groups know you are safe."
        ]
    elif any(k in msg_lower for k in ["first aid", "medical", "sick", "injured", "bite", "fever", "wound"]):
        reply = (
            "If someone has a wound or is injured, keep them dry and warm. Floodwaters are highly contaminated "
            "with sewage, chemicals, and disease-carrying bacteria. Wash any cuts immediately with clean water and apply antiseptic if available."
        )
        tips = [
            "Do not consume floodwater. Boil all drinking water or use water purification tablets.",
            "Keep wounds covered with waterproof bandages. Avoid contact with floodwater to prevent leptospirosis and skin infections.",
            "Watch out for snakes, scorpions, and insects which seek dry shelter inside houses during floods.",
            "Seek medical attention at the nearest Relief Center if symptoms of waterborne diseases (cholera, typhoid, diarrhea) appear."
        ]
    elif any(k in msg_lower for k in ["shelter", "camp", "food", "water", "rations", "stay"]):
        reply = (
            "You can search for the nearest open relief shelters on our map page. These centers are managed by NDMA and partner NGOs "
            "and provide emergency housing, drinking water, meals, and first-aid kits."
        )
        tips = [
            "Use the 'Find Nearest Shelter' button on our dashboard to locate centers with active capacity.",
            "Take essential medicines, baby food, and clean clothes with you to the shelter.",
            "Adhere to instructions from the shelter coordinators regarding resource distribution."
        ]
    else:
        reply = (
            "Hello! I am your AI Emergency Assistant. I can assist with flood preparedness advice, evacuation steps, "
            "first-aid safety guidelines, and locating nearby resources in Pakistan. "
            "What emergency details can I help you with today?"
        )
        tips = SAFETY_TIPS_GENERAL
        
    return {
        "reply": reply,
        "safety_tips": tips,
        "emergency_contacts": EMERGENCY_CONTACTS
    }

@router.post("/", response_model=ChatResponse)
def chat_assistant(input_data: ChatInput, db: Session = Depends(get_db)):
    # 1. Fetch active alerts
    active_alerts = db.query(Alert).filter(Alert.active == True).all()
    alerts_ctx = ""
    for a in active_alerts:
        alerts_ctx += f"- {a.title}: {a.message} (Risk: {a.risk_level}, Coord: {a.latitude},{a.longitude})\n"
    if not alerts_ctx:
        alerts_ctx = "No active critical flood alerts currently broadcasted."

    # 2. Fetch latest weather readings for all cities
    subquery = db.query(
        WeatherReading.city, 
        func.max(WeatherReading.recorded_at).label('max_date')
    ).group_by(WeatherReading.city).subquery()
    
    weather_readings = db.query(WeatherReading).join(
        subquery, 
        (WeatherReading.city == subquery.c.city) & (WeatherReading.recorded_at == subquery.c.max_date)
    ).all()
    
    weather_ctx = ""
    for w in weather_readings:
        weather_ctx += f"- {w.city}: {w.temperature}°C, {w.rainfall_mm}mm rain, {w.humidity}% humidity, {w.wind_speed}km/h wind\n"
    if not weather_ctx:
        weather_ctx = "No live weather feed metrics available."

    # 3. Fetch shelters capacity
    shelters = db.query(Shelter).all()
    shelters_ctx = ""
    for s in shelters:
        shelters_ctx += f"- {s.name}: Occupancy {s.current_occupancy}/{s.capacity} (Status: {s.status}, Phone: {s.contact_number or 'N/A'}, Coord: {s.latitude},{s.longitude})\n"
    if not shelters_ctx:
        shelters_ctx = "No registered relief shelter camps registered."

    # 4. Route to Gemini or fallback
    if settings.GEMINI_API_KEY:
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            prompt = f"""
You are the AI Emergency Response Assistant for the Pakistan Flood Prediction Portal. 
Your objective is to provide citizens with helpful, factual, and actionable advice based on real-time emergency context.

--- ACTIVE REGIONAL ALERTS ---
{alerts_ctx}

--- REAL-TIME WEATHER FEED ---
{weather_ctx}

--- REGISTERED RELIEF SHELTERS ---
{shelters_ctx}

User Message: "{input_data.message}"

Instructions:
1. Address the user's specific query. Use the live context data above whenever relevant (e.g. if they ask about weather in Nowshera or where to stay).
2. Keep your answer brief, helpful, and highly clear (maximum 2-3 sentences).
3. If they are in immediate danger, remind them of emergency helplines.
4. Do not make up facts or ignore the database numbers provided.
"""
            response = model.generate_content(prompt)
            reply_text = response.text.strip()
            
            # Formulate dynamic safety tips based on content
            tips = SAFETY_TIPS_GENERAL
            if "rescue" in input_data.message.lower() or "help" in input_data.message.lower():
                tips = [
                    "Call 1122 (Rescue) or 1189 (NDMA) immediately.",
                    "Climb to the roof of your building if rising water threatens you.",
                    "Use a flashlight or colored cloth to signal rescuers."
                ]
                
            return ChatResponse(
                reply=reply_text,
                safety_tips=tips,
                emergency_contacts=EMERGENCY_CONTACTS
            )
        except Exception as e:
            print(f"Gemini Chatbot Error: {e}. Routing to fallback.")
            
    # Fallback to rule-based parser
    fallback_res = formulate_fallback_reply(input_data.message)
    return ChatResponse(
        reply=fallback_res["reply"],
        safety_tips=fallback_res["safety_tips"],
        emergency_contacts=fallback_res["emergency_contacts"]
    )
