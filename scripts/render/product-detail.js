// scripts/render/product-detail.js
import { getRouteParams, navigate } from "../router.js";
import { getProducts, addRemoteCartItem } from "../supabaseDatabase.js";
import { addCartItem } from "../storage.js";
import { showToast } from "../ui.js";
import state from "../state.js";

export async function renderProductDetail() {
  const container = document.getElementById("router-view");
  if (!container) return;

  try {
    const { productId } = getRouteParams();
    const products = await getProducts();
    const product = products.find(p => String(p.id) === String(productId)) || products[0];
    if (!product) return;

    // -- Main image
    const mainImg = container.querySelector(".pd-main-img");
    if (mainImg) { mainImg.src = product.image; mainImg.alt = product.title; }

    // -- Gallery thumbnails: show first image, hide extras if no extra images
    const thumbsEl = container.querySelector(".pd-thumbs");
    if (thumbsEl) {
      // Products only have one image currently — show just that
      thumbsEl.innerHTML = `<img class="active" src="${product.image}" alt="${product.title}">`;
      thumbsEl.querySelectorAll("img").forEach(thumb => {
        thumb.addEventListener("click", () => {
          if (mainImg) mainImg.src = thumb.src;
          thumbsEl.querySelectorAll("img").forEach(t => t.classList.remove("active"));
          thumb.classList.add("active");
        });
      });
    }

    // -- Breadcrumb
    const crumb = container.querySelector(".pd-breadcrumbs");
    if (crumb) crumb.innerHTML = `Shop / ${product.category ?? "Furniture"} / <span>${product.title}</span>`;

    // -- Eyebrow
    const eyebrow = container.querySelector(".pd-eyebrow");
    if (eyebrow) eyebrow.textContent = product.rrp ?? "Authenticated";

    // -- Title
    const title = container.querySelector(".pd-title");
    if (title) title.textContent = product.title;

    // -- Price
    const price = container.querySelector(".pd-price");
    if (price) price.textContent = product.price;

    // -- Condition
    const condEl = container.querySelector(".pd-condition");
    if (condEl) condEl.innerHTML = `
      <span>Condition</span>
      <strong>${product.condition ?? "Excellent (Pre-owned)"}</strong>
      <em>${product.category ?? "Furniture"}</em>`;

    // -- Description (use real description if available)
    const desc = container.querySelector(".pd-desc");
    if (desc) desc.textContent = product.description
      ?? "A beautifully curated preloved piece, sustainably sourced and authenticity verified.";

    // -- Seller
    const sellerName = container.querySelector(".pd-seller strong");
    if (sellerName) sellerName.textContent = product.maker ?? "ReHome Seller";

    // -- Add to Cart button
    const btnCart = container.querySelector("[data-add-cart]");
    if (btnCart) {
      const newBtn = btnCart.cloneNode(true);
      btnCart.parentNode.replaceChild(newBtn, btnCart);
      newBtn.addEventListener("click", async () => {
        newBtn.textContent = "Adding...";
        newBtn.disabled = true;
        const remoteAdded = await addRemoteCartItem(product);
        if (!remoteAdded) addCartItem(product);
        state.publish("cartUpdated", product);
        showToast(`${product.title} added to your selection.`);
        newBtn.textContent = "Add to Cart";
        newBtn.disabled = false;
        navigate("cart");
      });
    }

  } catch (err) {
    console.warn("Failed to load product detail:", err);
  }
}