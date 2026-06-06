import { navigate } from "../router.js";
import state from "../state.js";
import { clampInteger, sanitizeShortText, toSafeNumber } from "../security.js";
import { getSupabaseClient } from "../supabaseClient.js";
import { showToast } from "../ui.js";

async function checkoutCart() {
  const supabase = await getSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Please sign in before checkout.");

  const { data: cartItems, error: cartError } = await supabase
    .from("cart_items")
    .select("id, quantity, products(id, title, price)")
    .eq("user_id", user.id);

  if (cartError) throw cartError;
  if (!cartItems?.length) throw new Error("Your cart is empty.");

  const subtotal = cartItems.reduce((sum, item) => {
    const quantity = clampInteger(item.quantity, 1, 99, 1);
    return sum + (toSafeNumber(item.products?.price) * quantity);
  }, 0);
  const shipping = subtotal > 0 ? 50 : 0;
  const total = subtotal + shipping;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      status: "pending",
      subtotal,
      shipping,
      carbon_credit: 0,
      total
    })
    .select("id")
    .single();

  if (orderError) throw orderError;

  const orderItems = cartItems.map((item) => ({
    order_id: order.id,
    product_id: item.products?.id,
    title: sanitizeShortText(item.products?.title, "Untitled item"),
    quantity: clampInteger(item.quantity, 1, 99, 1),
    price: toSafeNumber(item.products?.price)
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
  if (itemsError) throw itemsError;

  const { error: clearError } = await supabase.from("cart_items").delete().eq("user_id", user.id);
  if (clearError) throw clearError;
}

export function renderCheckout() {
  bindCheckout();
}

export function bindCheckout() {
  const button = document.querySelector("[data-checkout-submit]") || document.querySelector(".btn-green");
  if (!button || button.dataset.checkoutBound === "true") return;

  button.dataset.checkoutBound = "true";
  button.removeAttribute("data-route");
  button.addEventListener("click", async () => {
    const originalText = button.textContent;

    button.disabled = true;
    button.textContent = "Processing...";

    try {
      await checkoutCart();
      state.publish("cartUpdated", []);
      showToast("Order placed successfully!");
      navigate("confirmation");
    } catch (error) {
      showToast(error.message || "Checkout failed. Please try again.");
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });
}
