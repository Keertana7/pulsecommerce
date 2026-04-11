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
      <h2 className="products-title">Products</h2>
      
    </div>
  );
}