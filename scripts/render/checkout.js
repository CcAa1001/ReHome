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
    .select("id, quantity, products(id, title, price, carbon_offset, stock)")
    .eq("user_id", user.id);

  if (cartError) throw cartError;
  if (!cartItems?.length) throw new Error("Your cart is empty.");

  const subtotal = cartItems.reduce((sum, item) => {
    const quantity = clampInteger(item.quantity, 1, 99, 1);
    return sum + (toSafeNumber(item.products?.price) * quantity);
  }, 0);
  const totalCarbonOffset = cartItems.reduce((sum, item) => {
    const quantity = clampInteger(item.quantity, 1, 99, 1);
    return sum + (toSafeNumber(item.products?.carbon_offset) * quantity);
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
      carbon_credit: totalCarbonOffset,
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

  // Deduct stock and set sold status if 0
  for (const item of cartItems) {
    const p = item.products;
    if (p && p.id) {
      const q = clampInteger(item.quantity, 1, 99, 1);
      const newStock = Math.max(0, (toSafeNumber(p.stock, 1)) - q);
      const newStatus = newStock === 0 ? 'sold' : 'active';
      
      await supabase.from("products").update({
        stock: newStock,
        status: newStatus
      }).eq("id", p.id);
    }
  }

  // Add impact points to user profile
  if (totalCarbonOffset > 0) {
    const points = Math.floor(totalCarbonOffset * 10);
    const { data: prof } = await supabase.from("profiles").select("impact_score").eq("id", user.id).single();
    if (prof) {
      await supabase.from("profiles").update({ impact_score: (prof.impact_score || 0) + points }).eq("id", user.id);
    }
  }

  const { error: clearError } = await supabase.from("cart_items").delete().eq("user_id", user.id);
  if (clearError) throw clearError;
}

export async function renderCheckout() {
  const content = document.getElementById("checkout-content");
  const emptyState = document.getElementById("checkout-empty-state");
  const submitBtn = document.getElementById("btn-submit-checkout");
  const summaryBox = document.getElementById("co-summary-items");

  try {
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (content) content.style.display = "none";
      if (emptyState) {
        emptyState.style.display = "block";
        emptyState.querySelector("h2").textContent = "Please sign in";
        emptyState.querySelector("p").textContent = "You need to be signed in to checkout.";
      }
      return;
    }

    // Profile for shipping info
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    const shippingEl = document.getElementById("co-shipping-info");
    if (shippingEl) {
      shippingEl.innerHTML = `${profile?.full_name || "User"}<br>${profile?.location || "No address provided"}`;
    }

    // Cart items
    const { data: cartItems } = await supabase
      .from("cart_items")
      .select("id, quantity, products(id, title, price)")
      .eq("user_id", user.id);

    if (!cartItems || cartItems.length === 0) {
      if (content) content.style.display = "none";
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    if (content) content.style.display = "grid";
    if (emptyState) emptyState.style.display = "none";

    let subtotal = 0;
    if (summaryBox) summaryBox.innerHTML = "";
    
    cartItems.forEach(item => {
      const p = item.products;
      if (!p) return;
      const q = clampInteger(item.quantity, 1, 99, 1);
      const price = toSafeNumber(p.price) * q;
      subtotal += price;
      
      if (summaryBox) {
        const div = document.createElement("div");
        div.className = "summary-item";
        div.innerHTML = `<span>${p.title} ${q > 1 ? 'x'+q : ''}</span>$${price.toLocaleString()}`;
        summaryBox.appendChild(div);
      }
    });

    const shipping = subtotal > 0 ? 50 : 0;
    const total = subtotal + shipping;

    const elSub = document.getElementById("co-subtotal");
    const elShip = document.getElementById("co-shipping");
    const elTot = document.getElementById("co-total");

    if (elSub) elSub.textContent = "$" + subtotal.toLocaleString();
    if (elShip) elShip.textContent = shipping === 0 ? "Free" : "$" + shipping;
    if (elTot) elTot.textContent = "$" + total.toLocaleString();

    if (submitBtn && submitBtn.dataset.checkoutBound !== "true") {
      submitBtn.dataset.checkoutBound = "true";
      submitBtn.addEventListener("click", async () => {
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Processing...";
        try {
          await checkoutCart();
          navigate("confirmation");
        } catch (err) {
          showToast(err.message || "Failed to checkout.");
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      });
    }

  } catch (error) {
    showToast("Error loading checkout data.");
  }
}
