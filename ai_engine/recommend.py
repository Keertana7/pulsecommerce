import json

with open("data/products.json") as f:
    products = json.load(f)

def recommend_products(intent, entities):

    if intent != "product_search":
        return []

    category = entities.get("category")

    results = []

    for p in products:
        if category and p["category"] == category:
            results.append(p)

    return results[:3]