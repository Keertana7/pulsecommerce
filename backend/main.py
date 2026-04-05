from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

import threading
import time


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# 🧠 MEMORY STORAGE
context = {}

def schedule_message(user_id, text, delay):
    def send_later():
        time.sleep(delay)
        print(f"Reminder for {user_id}: {text}")

    threading.Thread(target=send_later).start()


# Request model
class MessageRequest(BaseModel):
    user_id: str
    message: str
    channel: str

@app.get("/")
def home():
    return {"message": "Backend is running 🚀"}


# ⏰ DELAYED MESSAGE FUNCTION
def schedule_message(user_id, text, delay):
    def send_later():
        time.sleep(delay)
        print(f"Reminder for {user_id}: {text}")

    threading.Thread(target=send_later).start()


# 🔥 MAIN API
@app.post("/message")
def handle_message(data: MessageRequest):

    user = data.user_id
    msg = data.message.lower()

    # get user context
    user_ctx = context.get(user, {
        "last_product": None,
        "cart_items": [],
        "last_intent": None
    })

    # 🧠 UPDATE CONTEXT
    if "shoes" in msg:
        user_ctx["last_product"] = "shoes"
        user_ctx["last_intent"] = "query"

    elif "buy" in msg:
        product = user_ctx["last_product"]

        if product:
            user_ctx["cart_items"].append(product)
            user_ctx["last_intent"] = "buy"

            # ⏰ reminder
            schedule_message(user, "You left items in cart 🛒", 10)

        else:
            return {
                "reply": "What do you want to buy?",
                "channel": data.channel
            }

    # 🤖 AI reply
    reply = ai_response(msg, user_ctx)

    # save context
    context[user] = user_ctx

    return {
        "reply": reply,
        "channel": data.channel
    }
# 🔥 GET CONTEXT API
@app.get("/context/{user_id}")
def get_context(user_id: str):
    return context.get(user_id, {})

@app.post("/schedule-message")
def schedule_api(user_id: str, message: str, delay: int):
    schedule_message(user_id, message, delay)
    return {"status": "Message scheduled successfully"}

# 🧠 AI LAYER
def ai_response(message, context):
    if "shoes" in message:
        return "We have Nike & Adidas 👟"
    elif "buy" in message:
        return f"{context.get('last_product', 'item')} added to cart 🛒"

    else:
        return "Sorry, I didn’t understand"