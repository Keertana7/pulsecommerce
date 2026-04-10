class ConversationContext:
    def __init__(self):
        self.history = []
        self.last_product = None

    def update_history(self, message, intent):
        self.history.append({
            "message": message,
            "intent": intent
        })

    def set_last_product(self, product):
        self.last_product = product

    def get_last_product(self):
        return self.last_product or "item"