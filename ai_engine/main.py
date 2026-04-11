from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, Any, Optional

# 🔥 Internal modules
from intent import IntentDetector
from context import ConversationContext
from recommend import recommend_products
from response import generate_response
from fastapi.middleware.cors import CORSMiddleware
# =========================
# 🚀 INIT APP
# =========================
app = FastAPI(title="AI Messaging Engine")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
detector = IntentDetector()

# =========================
# 🧠 CONTEXT STORE (In-memory)
# =========================
user_context_store: Dict[str, ConversationContext] = {}

def get_user_context(user_id: str) -> ConversationContext:
    if user_id not in user_context_store:
        user_context_store[user_id] = ConversationContext()
    return user_context_store[user_id]

# =========================
# 📦 REQUEST MODEL
# =========================
class UserRequest(BaseModel):
    user_id: str
    message: str
    context: Optional[Dict[str, Any]] = None


# =========================
# 🔥 MAIN API
# =========================
@app.post("/generate-response")
def generate_response_api(req: UserRequest):

    # 1️⃣ Get user context
    context = get_user_context(req.user_id)

    # 2️⃣ Detect intent safely
    try:
        intent, entities = detector.detect(
            req.message,
            context={"history": context.history}
        )
    except Exception as e:
        print("Intent error:", e)
        intent, entities = "fallback", {}

    # 3️⃣ Update context
    context.update_history(req.message, intent)

    # limit memory (important)
    if len(context.history) > 10:
        context.history = context.history[-10:]

    # 4️⃣ Recommendations
    product_suggestions = recommend_products(intent, entities)

    # 5️⃣ Generate response
    reply = generate_response(
        intent=intent,
        entities=entities,
        context=context,
        products=product_suggestions
    )

    # 6️⃣ Debug logs
    print(f"[USER]: {req.message}")
    print(f"[INTENT]: {intent}")
    print(f"[ENTITIES]: {entities}")
    print(f"[PRODUCT COUNT]: {len(product_suggestions)}")
    
    return {
        "reply": reply,
        "intent": intent,
        "products": product_suggestions
    }


# =========================
# 🧪 OPTIONAL ENDPOINT
# =========================
@app.post("/recommend-products")
def recommend_products_api(req: UserRequest):

    intent, entities = detector.detect(req.message)
    products = recommend_products(intent, entities)

    return {
        "products": products
    }


# =========================
# 🟢 HEALTH CHECK
# =========================
@app.get("/")
def home():
    return {"message": "AI Engine is running 🚀"}
