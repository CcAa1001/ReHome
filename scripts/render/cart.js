import { isUuid, sanitizeShortText, sanitizeUrl, toSafeMoney, toSafeNumber } from "../security.js";
import { getSupabaseClient } from "../supabaseClient.js";
import { showToast } from "../ui.js";

export async function renderCart() {
  const container = document.getElementById("router-view");
  if (!container) return;

  container.innerHTML = `<div style="padding: 100px; text-align: center; font-weight: bold; color: #78716c;">Syncing your cart...</div>`;

  try {
    const supabase = await getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      container.innerHTML = `
        <div style="padding: 100px; text-align: center;">
          <h2 style="font-family: var(--serif);">Please Sign In</h2>
          <p style="color: #78716c;">You need to be signed in to view your cart.</p>
        </div>`;
      return;
    }

    const { data: cartItems, error } = await supabase
      .from("cart_items")
      .select("*, products(*)")
      .eq("user_id", session.user.id);

    if (error) throw error;

    if (!cartItems || cartItems.length === 0) {
      container.innerHTML = `
        <div style="padding: 120px 20px; text-align: center;">
          <h2 style="font-family: var(--serif); font-size: 32px; color: #1c1917;">Your Cart is Empty</h2>
          <p style="color: #78716c; margin-top: 12px;">Looks like you haven't added any treasures yet.</p>
          <button data-route="shop" style="margin-top: 24px; padding: 14px 28px; background: #3d5a30; color: white; border: none; border-radius: 12px; font-weight: bold; cursor: pointer;">Explore Shop</button>
        </div>
      `;
      return;
    }

    const subtotal = cartItems.reduce((sum, item) => {
      return sum + (toSafeNumber(item.products?.price) * toSafeNumber(item.quantity, 1));
    }, 0);
    const shipping = subtotal > 0 ? 50 : 0;
    const total = subtotal + shipping;

    container.innerHTML = `
      <div style="max-width: 1100px; margin: 0 auto; padding: 60px 20px; font-family: var(--sans); color: #1c1917; padding-bottom: 120px;">
        <h1 style="font-family: var(--serif); font-size: 40px; margin-bottom: 40px;">Your Cart</h1>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 48px; align-items: start;">
          <div style="display: flex; flex-direction: column; gap: 24px;">
            ${cartItems.map((item) => {
              const product = item.products ?? {};
              const safeTitle = sanitizeShortText(product.title, "Cart item");
              const safeCategory = sanitizeShortText(product.category, "Furniture");
              const safeCondition = sanitizeShortText(product.condition, "Excellent");
              const safeMaker = sanitizeShortText(product.maker, "Unknown maker");
              const safeImage = sanitizeUrl(product.image_url);
              const safePrice = toSafeMoney(product.price);
              const safeQty = toSafeNumber(item.quantity, 1);
              const safeCartId = sanitizeShortText(item.id);

              return `
              <div style="display: flex; gap: 24px; padding-bottom: 24px; border-bottom: 1px solid #e7e5e4;">
                <img src="${safeImage}" alt="${safeTitle}" style="width: 140px; height: 140px; object-fit: cover; border-radius: 16px; background: #fbfaf9;">
                <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                      <h3 style="font-size: 18px; margin: 0; font-weight: 700;">${safeTitle}</h3>
                      <strong style="font-size: 18px;">$${safePrice}</strong>
                    </div>
                    <span style="font-size: 13px; color: #78716c; display: block; margin-top: 4px;">${safeCategory} - ${safeCondition}</span>
                    <span style="font-size: 13px; color: #78716c; display: block; margin-top: 4px;">Maker: ${safeMaker}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 14px; font-weight: 600;">Qty: ${safeQty}</span>
                    <button class="btn-remove-item" data-cart-id="${safeCartId}" style="background: none; border: none; color: #dc2626; cursor: pointer; font-size: 14px; font-weight: 700; transition: 0.2s;">Remove Item</button>
                  </div>
                </div>
              </div>`;
            }).join("")}
          </div>

          <div style="background: #fbfaf9; padding: 32px; border-radius: 20px; border: 1px solid #e7e5e4; position: sticky; top: 100px;">
            <h2 style="font-size: 22px; margin-top: 0; margin-bottom: 24px; font-family: var(--serif);">Order Summary</h2>
            <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 15px;">
              <span style="color: #78716c;">Subtotal</span>
              <strong>$${subtotal.toFixed(2)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e7e5e4; font-size: 15px;">
              <span style="color: #78716c;">Estimated Shipping</span>
              <strong>$${shipping.toFixed(2)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 32px; font-size: 22px;">
              <strong>Total</strong>
              <strong>$${total.toFixed(2)}</strong>
            </div>
            <button data-route="checkout" style="width: 100%; padding: 18px; background: #3d5a30; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; transition: 0.2s;">Proceed to Checkout</button>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll(".btn-remove-item").forEach((btn) => {
      btn.addEventListener("click", async (event) => {
        const cartId = event.target.dataset.cartId;
        if (!isUuid(cartId)) {
          showToast("Invalid cart item.");
          return;
        }

        event.target.textContent = "Removing...";
        event.target.style.opacity = "0.5";

        await supabase.from("cart_items").delete().eq("id", cartId).eq("user_id", session.user.id);
        showToast("Item removed from cart");

        if (window.updateGlobalCartBadge) await window.updateGlobalCartBadge();
        renderCart();
      });
    });
  } catch (err) {
    console.error("Cart error:", err);
    container.innerHTML = `<div style="padding: 100px 20px; text-align: center; color: #dc2626;"><h2>Failed to load cart.</h2></div>`;
  }
}
