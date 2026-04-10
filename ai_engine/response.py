def generate_response(intent, entities, context, products):

    if intent == "greeting":
        return "Hi! How can I help you today? 😊"

    if intent == "product_search":
        if not products:
            return "Sorry, I couldn't find anything."

        reply = "Here are some options:\n"
        for p in products:
            reply += f"{p['name']} - ₹{p['price']}\n"

        # update context
        context.set_last_product(products[0]["name"])

        return reply

    if intent == "purchase":
        product = context.get_last_product()
        return f"Great choice! Your {product} order is placed 🎉"

    if intent == "product_query":
        return "This product is highly rated and value for money."

    return "Sorry, I didn't understand. Can you try again?"