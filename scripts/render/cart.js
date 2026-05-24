import { elements } from "../dom.js";
import { loadDatabase, removeCartItem } from "../storage.js";
import { getRemoteCart, removeRemoteCartItem } from "../supabaseDatabase.js?v=20260524-database4";

function formatMoney(value) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function renderCartSummary(cart) {
  const subtotal = cart.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  const carbonOffset = cart.reduce((sum, item) => sum + Number(item.carbonOffset ?? 0), 0);
  const offsetCredit = cart.length ? 4.5 : 0;
  const total = subtotal + offsetCredit;

  elements.cartSummary.innerHTML = `
    <div><dt>Subtotal</dt><dd>${formatMoney(subtotal)}</dd></div>
    <div><dt>Conscious Shipping</dt><dd>Free</dd></div>
    <div><dt>Carbon Saved</dt><dd>${carbonOffset.toFixed(1)}kg CO2</dd></div>
    <div><dt>Est. Carbon Offset</dt><dd>${formatMoney(offsetCredit)}</dd></div>
    <div class="total"><dt>Total</dt><dd>${formatMoney(total)}</dd></div>
  `;
}

export async function renderCart() {
  const database = loadDatabase();
  const cart = await getRemoteCart() ?? database.cart;
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
        <button type="button" data-remove-cart="${index}" ${item.remoteCartId ? `data-remote-cart-id="${item.remoteCartId}"` : ""}>Remove</button>
      </div>
      <strong>${item.price}</strong>
    `;
    return card;
  }));
}

export function bindCartRemoval(onChange) {
  elements.cartList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest("[data-remove-cart]");
    if (!removeButton) {
      return;
    }

    if (removeButton.dataset.remoteCartId) {
      await removeRemoteCartItem(removeButton.dataset.remoteCartId);
    } else {
      removeCartItem(Number(removeButton.dataset.removeCart));
    }

    await onChange();
  });
}
