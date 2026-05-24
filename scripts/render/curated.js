// scripts/render/curated.js
import { getRouteParams } from "../router.js";
import { getProducts } from "../supabaseDatabase.js";
import { addRemoteCartItem } from "../supabaseDatabase.js";
import { addCartItem } from "../storage.js";
import { showToast } from "../ui.js";
import { navigate } from "../router.js";
import state from "../state.js";

export async function renderCurated(container) {
  const { productId } = getRouteParams();

  container.innerHTML = `
    <div class="skeleton-card">
      <div class="skeleton skeleton-image" style="height:400px"></div>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
    </div>
  `;

  const products = await getProducts();
  const product  = products.find((p) => p.id === productId) ?? products[0];

  if (!product) {
    container.innerHTML = "<p>Product not found.</p>";
    return;
  }

  container.innerHTML = `
    <div class="image-frame">
      <img src="${product.image}" alt="${product.alt}">
      ${product.condition === "Pristine" ? '<span class="badge">Pristine</span>' : ""}
    </div>
    <div class="product-info">
      <div>
        <span>${product.maker}</span>
        <h3>${product.title}</h3>
        <p>${product.meta}</p>
        <strong class="detail-price">${product.price}</strong>
        <p>Carbon offset: ${product.carbonOffset}kg CO₂</p>
      </div>
      <button class="primary-button" id="detail-add-cart">Add to Selection</button>
    </div>
  `;

  document.getElementById("detail-add-cart").addEventListener("click", async () => {
    const remoteAdded = await addRemoteCartItem(product);
    if (!remoteAdded) addCartItem(product);

    state.publish("cartUpdated", product);
    showToast(`${product.title} added to your selection.`);
    navigate("cart");
  });
}