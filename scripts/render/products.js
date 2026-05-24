// scripts/render/products.js
import { elements } from "../dom.js";
import { navigate } from "../router.js";
import { getProducts } from "../supabaseDatabase.js";
import { showToast } from "../ui.js";

let activeCategory = "all";

export function setCategoryFilter(category) {
  activeCategory = category;
}

// ── TEMPLATE ─────────────────────────────────────────────────────────────────

function createProductCard(product, compact = false) {
  const card = document.createElement("article");
  card.className = compact ? "catalog-card" : "product-card";

  if (compact) {
    card.innerHTML = `
      <img src="${product.image}" alt="${product.alt}">
      <div>
        <span>${product.condition}</span>
        <h3>${product.title}</h3>
        <p>${product.meta}</p>
        <strong>${product.price}</strong>
        <small>${product.rrp}</small>
      </div>
    `;
  } else {
    card.innerHTML = `
      <div class="image-frame">
        <img src="${product.image}" alt="${product.alt}">
        ${product.condition === "Pristine" ? '<span class="badge">Pristine</span>' : ""}
      </div>
      <div class="product-info">
        <div><span>${product.maker}</span><h3>${product.title}</h3></div>
        <strong>${product.price}</strong>
      </div>
    `;
  }

  card.addEventListener("click", () => navigate("curated"));
  return card;
}

// ── LOADING PLACEHOLDER ───────────────────────────────────────────────────────

function showProductSkeletons(container, count = 3, compact = false) {
  const skeletons = Array.from({ length: count }, () => {
    const el = document.createElement("article");
    el.className = compact ? "catalog-card skeleton-card" : "product-card skeleton-card";
    el.innerHTML = `
      <div class="skeleton skeleton-image"></div>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
    `;
    return el;
  });
  container.replaceChildren(...skeletons);
}

// ── RENDER ────────────────────────────────────────────────────────────────────

export async function renderProducts() {
  // Tampilkan skeleton di kedua container sambil menunggu data
  showProductSkeletons(elements.homeProducts, 3, false);
  showProductSkeletons(elements.catalogProducts, 6, true);

  let products;
  try {
    products = await getProducts();
  } catch (error) {
    showToast("Could not load products. Please try again.");
    elements.homeProducts.innerHTML    = "<p>Failed to load products.</p>";
    elements.catalogProducts.innerHTML = "<p>Failed to load products.</p>";
    return;
  }

  const catalogProducts = activeCategory === "all"
    ? products
    : products.filter((p) => p.category === activeCategory);

  elements.homeProducts.replaceChildren(
    ...products.slice(0, 3).map((p) => createProductCard(p, false))
  );
  elements.catalogProducts.replaceChildren(
    ...catalogProducts.map((p) => createProductCard(p, true))
  );
}