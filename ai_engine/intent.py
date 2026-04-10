
# intent.py

import google.generativeai as genai
import json
import os
from dotenv import load_dotenv
from pathlib import Path
# =========================
# 🔐 LOAD ENV VARIABLES
# =========================
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

print("DEBUG API KEY:", GEMINI_API_KEY)

if not GEMINI_API_KEY:
    raise ValueError("❌ GEMINI_API_KEY not found in .env file")


# =========================
# ⚙️ CONFIGURE GEMINI
# =========================
genai.configure(api_key=GEMINI_API_KEY)

model = genai.GenerativeModel("gemini-2.5-flash")


class IntentDetector:

    def detect(self, message, context=None):

        history = context.get("history", []) if context else []

        prompt = f"""
You are an AI intent detection system for an e-commerce chatbot.

Return ONLY JSON.

INTENTS:
- product_search (e.g., "shoes", "show me shoes", "nike shoes", "laptops")
- product_query (e.g., "price of iPhone", "details of shoes")
- purchase (e.g., "buy this", "place order")
- greeting (e.g., "hi", "hello")
- fallback (anything else)

IMPORTANT:
- Even single-word inputs like "shoes", "laptops", "mobiles" should be classified as product_search

ENTITIES:
- category
- brand
- price_range

CONTEXT:
{history}

MESSAGE:
"{message}"

FORMAT:
{{
  "intent": "...",
  "entities": {{
    "category": "",
    "brand": "",
    "price_range": ""
  }}
}}
"""

        try:
            response = model.generate_content(
                prompt,
                generation_config={"temperature": 0.2}
            )

            text = (response.text or "").strip()

            import re
            text = re.sub(r"```json|```", "", text).strip()

            print("🧠 RAW AI RESPONSE:", text)

            result = json.loads(text)

            intent = result.get("intent", "fallback")
            entities = result.get("entities", {})

            return intent, entities

        except json.JSONDecodeError:
            print("❌ JSON parsing failed")
            return "fallback", {}

        except Exception as e:
            print("❌ Error in intent detection:", e)
            return "fallback", {}