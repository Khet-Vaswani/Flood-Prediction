from fastapi import APIRouter
from app.schemas import ChatInput, ChatResponse

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

def formulate_reply(message: str) -> dict:
    msg_lower = message.lower()
    
    reply = ""
    tips = []
    
    # 1. Rescue / Emergency
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
        
    # 2. Evacuation / Route
    elif any(k in msg_lower for k in ["evacuate", "leave", "route", "road", "safe way", "escape"]):
        reply = (
            "During an active flood event, check the live Flood Risk Map on our portal to locate officially designated safe evacuation corridors. "
            "Only use routes recommended by NDMA or provincial authorities. Avoid shortcuts, as they may lead to flooded drainage canals or collapsed bridges."
        )
        tips = [
            "Follow official evacuation orders immediately when issued.",
            "Travel during daylight hours to avoid unseen road washouts and debris.",
            "Wear study boots and long trousers to protect against waterborne debris and contaminants.",
            "Check in at your nearest registered relief camp/shelter so rescue groups know you are safe."
        ]
        
    # 3. First Aid / Medical
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
        
    # 4. Shelters / Food
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
        
    # 5. Default Response
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
def chat_assistant(input_data: ChatInput):
    response_data = formulate_reply(input_data.message)
    return response_data
