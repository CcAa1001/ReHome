import { elements } from "../dom.js";
import { navigate } from "../router.js";
import { getProducts } from "../supabaseDatabase.js?v=20260524-database4";

let activeCategory = "all";

export function setCategoryFilter(category) {
  activeCategory = category;
}

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

export async function renderProducts() {
  const products = await getProducts();
  const catalogProducts = activeCategory === "all"
    ? products
    : products.filter((product) => product.category === activeCategory);

  elements.homeProducts.replaceChildren(...products.slice(0, 3).map((product) => createProductCard(product)));
  elements.catalogProducts.replaceChildren(...catalogProducts.map((product) => createProductCard(product, true)));
}
