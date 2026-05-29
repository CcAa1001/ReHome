import { elements } from "../dom.js";
import { Maps } from "../router.js";
import state from "../state.js";
import { checkoutCart } from "../supabaseDatabase.js";
import { showToast } from "../ui.js";

export function bindCheckout() {
  elements.checkoutSubmitButton?.addEventListener("click", async () => {
    const button = elements.checkoutSubmitButton;
    const originalText = button.textContent;

    button.disabled = true;
    button.textContent = "Processing...";

    try {
      await checkoutCart();
      state.publish("cartUpdated", []);
      showToast("Pesanan berhasil dibuat!");
      Maps("confirmation");
    } catch (error) {
      showToast(error.message || "Checkout gagal. Silakan coba lagi.");
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });
}
