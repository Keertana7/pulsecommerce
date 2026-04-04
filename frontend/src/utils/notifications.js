import { toast } from "react-toastify";

export const showCartReminder = () => {
  toast.info("👀 You left items in your cart!");
};

export const showDiscount = () => {
  toast.success("🔥 10% discount applied!");
};