// scripts/render/checkout.js
import { elements }   from "../dom.js";
import { navigate }   from "../router.js"; // ← Maps → navigate
import state          from "../state.js";
import { checkoutCart } from "../supabaseDatabase.js";
import { showToast }  from "../ui.js";

export function bindCheckout() {
  elements.checkoutSubmitButton?.addEventListener("click", async () => {
    const button       = elements.checkoutSubmitButton;
    const originalText = button.textContent;

    button.disabled    = true;
    button.textContent = "Processing...";

    try {
      await checkoutCart();
      state.publish("cartUpdated", []);
      showToast("Order placed successfully!");
      navigate("confirmation");
    } catch (error) {
      showToast(error.message || "Checkout failed. Please try again.");
    } finally {
      button.disabled    = false;
      button.textContent = originalText;
    }
  });
}