import json
from pathlib import Path

# =========================
# 📥 LOAD PRODUCTS
# =========================
product_file = Path(__file__).parent / "data" / "products.json"

try:
    with open(product_file, "r", encoding="utf-8") as f:
        products = json.load(f)
except FileNotFoundError:
    print(f"⚠️  Warning: {product_file} not found")
    products = []
except json.JSONDecodeError:
    print(f"⚠️  Warning: Invalid JSON in {product_file}")
    products = []


# =========================
# 🎯 RECOMMENDATION FUNCTION
# =========================
def recommend_products(intent, entities):

    if intent != "product_search":
        return []

    category = entities.get("category", "").lower().strip()

    if not category:
        return []

    results = []

    for p in products:
        name = p.get("name", "").lower()
        cat = p.get("category", "").lower()

        # ✅ EXACT CATEGORY MATCH
        if category == cat:
            results.append(p)
        # ✅ CATEGORY IN PRODUCT NAME
        elif category in name or category in cat:
            results.append(p)

    return results[:3]