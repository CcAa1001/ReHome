// scripts/render/cart.js
import { elements } from "../dom.js";
import { loadDatabase, removeCartItem } from "../storage.js";
import { getRemoteCart, removeRemoteCartItem } from "../supabaseDatabase.js";
import { showToast } from "../ui.js";

// ── HELPERS ───────────────────────────────────────────────────────────────────

function formatMoney(value) {
  return `$${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function showCartLoading() {
  elements.cartList.innerHTML = `
    <article class="skeleton-card">
      <div class="skeleton skeleton-image"></div>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
    </article>
  `;
}

// ── SUMMARY ───────────────────────────────────────────────────────────────────

function renderCartSummary(cart) {
  const subtotal     = cart.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  const carbonOffset = cart.reduce((sum, item) => sum + Number(item.carbonOffset ?? 0), 0);
  const offsetCredit = cart.length ? 4.5 : 0;
  const total        = subtotal + offsetCredit;

  elements.cartSummary.innerHTML = `
    <div><dt>Subtotal</dt><dd>${formatMoney(subtotal)}</dd></div>
    <div><dt>Conscious Shipping</dt><dd>Free</dd></div>
    <div><dt>Carbon Saved</dt><dd>${carbonOffset.toFixed(1)}kg CO2</dd></div>
    <div><dt>Est. Carbon Offset</dt><dd>${formatMoney(offsetCredit)}</dd></div>
    <div class="total"><dt>Total</dt><dd>${formatMoney(total)}</dd></div>
  `;
}

// ── RENDER ────────────────────────────────────────────────────────────────────

export async function renderCart() {
  showCartLoading();

  let cart;
  try {
    const database = loadDatabase();
    cart = await getRemoteCart() ?? database.cart;
  } catch (error) {
    showToast("Could not load your cart. Please try again.");
    elements.cartList.innerHTML = "<p>Failed to load cart.</p>";
    return;
  }

  // Update badge angka keranjang di header
  elements.cartCount.textContent = cart.length;
  renderCartSummary(cart);

  if (!cart.length) {
    elements.cartList.innerHTML = `
      <article class="empty-state">
        <h3>Your selection is empty</h3>
        <p>Explore curated findings and add a piece when something feels right.</p>
      </article>
    `;
    return;
  }

  elements.cartList.replaceChildren(...cart.map((item, index) => {
    const card = document.createElement("article");
    card.className = "cart-item";
    card.innerHTML = `
      <img src="${item.image}" alt="${item.title}">
      <div>
        <span class="eyebrow">${item.label}</span>
        <h3>${item.title}</h3>
        <p>${item.meta}</p>
        <button
          type="button"
          data-remove-cart="${index}"
          ${item.remoteCartId ? `data-remote-cart-id="${item.remoteCartId}"` : ""}
        >Remove</button>
      </div>
      <strong>${item.price}</strong>
    `;
    return card;
  }));
}

// ── REMOVAL ───────────────────────────────────────────────────────────────────

export function bindCartRemoval(onChange) {
  elements.cartList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest("[data-remove-cart]");
    if (!removeButton) return;

    // Nonaktifkan tombol sementara agar tidak double-click
    removeButton.disabled = true;

    try {
      if (removeButton.dataset.remoteCartId) {
        await removeRemoteCartItem(removeButton.dataset.remoteCartId);
      } else {
        removeCartItem(Number(removeButton.dataset.removeCart));
        // state.publish('cartUpdated') sudah dipanggil di dalam removeCartItem
      }

      await onChange(); // → memanggil renderCart() + renderSettings() dari app.js
    } catch (error) {
      showToast("Could not remove item. Please try again.");
      removeButton.disabled = false;
    }
  });
}