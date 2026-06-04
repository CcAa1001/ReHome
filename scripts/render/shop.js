// scripts/render/shop.js
import { getProducts } from "../supabaseDatabase.js";
import { navigate, setRouteParams } from "../router.js";

let allProducts = [];
let currentView = "grid";
let page = 0;
const PAGE_SIZE = 9;

export async function renderShop() {
  const catalog = document.getElementById("shop-catalog");
  const countEl = document.querySelector(".shop-header p");
  if (!catalog) return;

  catalog.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:#78716c;">Loading...</div>`;

  try {
    allProducts = await getProducts();
  } catch (err) {
    catalog.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:#dc2626;">Failed to load products.</div>`;
    return;
  }

  if (countEl) countEl.textContent = `Discover ${allProducts.length} preloved architectural gems.`;

  page = 0;
  renderPage(catalog);
  bindShopControls(catalog);
}

function renderPage(catalog) {
  const slice = allProducts.slice(0, (page + 1) * PAGE_SIZE);
  catalog.innerHTML = slice.map(productCardHTML).join("");

  // bind card clicks
  catalog.querySelectorAll(".prod-card").forEach(card => {
    card.addEventListener("click", () => {
      setRouteParams({ productId: card.dataset.id });
      navigate("product-detail");
    });
  });

  const loadMoreBtn = document.querySelector(".load-more-btn");
  if (loadMoreBtn) {
    loadMoreBtn.style.display = slice.length >= allProducts.length ? "none" : "block";
  }
}

function productCardHTML(p) {
  return `
    <div class="prod-card" data-id="${p.id}">
      <img class="prod-img" src="${p.image}" alt="${p.alt}" loading="lazy"
           onerror="this.src='assets/figma-export/50c650dc19d53b235c064dcad7dc23f8b08e5668.png'">
      <div class="prod-info">
        <span>${p.condition ?? "Excellent"} · ${p.category ?? "Furniture"}</span>
        <h3>${p.title}</h3>
        <strong>${p.price}</strong>
      </div>
    </div>`;
}

function bindShopControls(catalog) {
  // View toggle (grid / list)
  document.querySelectorAll("[data-view-mode]").forEach(btn => {
    btn.addEventListener("click", () => {
      currentView = btn.dataset.viewMode;
      document.querySelectorAll("[data-view-mode]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      catalog.className = `product-container${currentView === "list" ? " list-view" : ""}`;
    });
  });

  // Sort
  const sortSelect = document.querySelector(".sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      if (sortSelect.value === "Price: Low to High") {
        allProducts = [...allProducts].sort((a, b) => a.amount - b.amount);
      } else {
        allProducts = [...allProducts].sort((a, b) => a.id > b.id ? -1 : 1);
      }
      page = 0;
      renderPage(catalog);
    });
  }

  // Load more
  const loadMoreBtn = document.querySelector(".load-more-btn");
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      page++;
      renderPage(catalog);
    });
  }

  // Condition chips filter
  document.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("active");
      applyFilters(catalog);
    });
  });

  // Category checkboxes
  document.querySelectorAll(".custom-checkbox input").forEach(cb => {
    cb.addEventListener("change", () => applyFilters(catalog));
  });
}

async function applyFilters(catalog) {
  const activeConditions = [...document.querySelectorAll(".chip.active")]
    .map(c => c.textContent.trim().toLowerCase());

  const checkedCategories = [...document.querySelectorAll(".custom-checkbox input:checked")]
    .map(c => c.closest("label").textContent.trim().toLowerCase());

  const allChecked = checkedCategories.includes("all furniture");

  let base = await getProducts();

  if (activeConditions.length) {
    base = base.filter(p => activeConditions.some(cond => p.condition?.toLowerCase().includes(cond)));
  }

  if (!allChecked && checkedCategories.length) {
    base = base.filter(p => checkedCategories.some(cat => p.category?.toLowerCase().includes(cat)));
  }

  allProducts = base;
  page = 0;
  renderPage(catalog);
}