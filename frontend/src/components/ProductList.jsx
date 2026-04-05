import { showCartReminder } from "../utils/notifications";

export default function ProductList() {
  const handleAddToCart = () => {
    console.log("Added to cart");

    setTimeout(() => {
      showCartReminder();
    }, 3000);
  };

  return (
    <div>
      <h2>Products</h2>
      <button onClick={handleAddToCart}>
        Add Shoes to Cart
      </button>
    </div>
  );
}