import google.generativeai as genai
import json
import os
from dotenv import load_dotenv
from pathlib import Path

# =========================
# LOAD ENV
# =========================
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("❌ GEMINI_API_KEY not found")

genai.configure(api_key=GEMINI_API_KEY)

model = genai.GenerativeModel("gemini-2.5-flash")


# =========================
# ✅ CLASS MUST EXIST
# =========================
class IntentDetector:

    def detect(self, message, context=None):

        message_lower = message.lower().strip()

        # 🔥 RULE-BASED FIX: Short queries are product searches
        if len(message_lower.split()) <= 2 and message_lower:
            return "product_search", {"category": message_lower}

        try:
            prompt = f"""
            Classify intent and return JSON.
            MESSAGE: "{message}"
            """

            response = model.generate_content(prompt)

            text = (response.text or "").strip()

            import re
            text = re.sub(r"```json|```", "", text).strip()

            result = json.loads(text)

            intent = result.get("intent", "fallback")
            entities = result.get("entities", {})

            if intent == "fallback":
                return "product_search", {"category": message_lower}

            return intent, entities

        except Exception as e:
            print("Error:", e)
            return "product_search", {"category": message_lower}