from fastapi import FastAPI
from pydantic import BaseModel
import threading
import time
from fastapi.middleware.cors import CORSMiddleware
# 🔥 FIREBASE SETUP
import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all (for hackathon)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# =========================
# 📦 REQUEST MODEL
# =========================
class MessageRequest(BaseModel):
    user_id: str
    message: str
    channel: str


# =========================
# 🔥 FETCH USER EVENTS
# =========================
def get_user_events(user_id):
    events_ref = db.collection("events")
    docs = events_ref.stream()   # 🔥 get ALL data

    events = []
    for doc in docs:
        data = doc.to_dict()
        print("Doc:", data)  # DEBUG

        if data.get("userId") == user_id:
            events.append(data)

    return events


# =========================
# 🧠 ANALYZE USER
# =========================
def analyze_user(events):
    views = [e for e in events if e.get("type") == "view"]
    cart = [e for e in events if e.get("type") == "add_to_cart"]
    searches = [e for e in events if e.get("type") == "search"]

    if len(cart) > 0:
        return "cart_abandoned"

    if len(views) > 3:
        return "high_interest"

    if len(searches) > 2:
        return "exploring"

    return "unknown"


# =========================
# 🤖 GENERATE MESSAGE
# =========================
def generate_message(intent, events):
    if not events:
        return "Can I help you with something?"

    # 🔥 FIND CORRECT PRODUCT (IMPORTANT FIX)
    for event in events:
        if event.get("type") == "add_to_cart":
            product = event.get("product", "item")

            if intent == "cart_abandoned":
                return f"You left {product} in your cart 🛒"

    # fallback logic
    last_product = events[-1].get("product", "item")

    if intent == "high_interest":
        return f"Still thinking about {last_product}? 👀"

    elif intent == "exploring":
        return f"Check out top deals on {last_product} 🔥"

    return "Can I help you with something?"


# =========================
# ⏰ DELAYED MESSAGE
# =========================
def schedule_message(user_id, text, delay):
    def send_later():
        time.sleep(delay)
        print(f"Reminder for {user_id}: {text}")

    threading.Thread(target=send_later).start()


# =========================
# 🔥 MAIN API
# =========================
@app.post("/message")
def handle_message(data: MessageRequest):
    user = data.user_id

    # 🔥 GET DATA FROM FIRESTORE
    events = get_user_events(user)
    print("Events:", events)   # DEBUG

    # 🧠 ANALYZE
    intent = analyze_user(events)

    # 🤖 GENERATE RESPONSE
    reply = generate_message(intent, events)

    return {
        "channel": data.channel,
        "user_id": user,
        "reply": reply
    }


# =========================
# 📊 GET CONTEXT (OPTIONAL)
# =========================
@app.get("/context/{user_id}")
def get_context(user_id: str):
    events = get_user_events(user_id)
    return {"events": events}


# =========================
# ⏰ SCHEDULE API
# =========================
@app.post("/schedule-message")
def schedule_api(user_id: str, message: str, delay: int):
    schedule_message(user_id, message, delay)
    return {"status": "Message scheduled"}
