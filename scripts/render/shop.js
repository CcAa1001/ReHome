// scripts/render/shop.js
import { getSupabaseClient } from "../supabaseClient.js";
import { navigate, setRouteParams } from "../router.js";

let allProducts = [];
let filteredProducts = [];
let currentView = "grid";
let page = 0;
const PAGE_SIZE = 9;

export async function renderShop() {
  const catalog = document.getElementById("shop-catalog") || document.querySelector(".product-grid");
  const countEl = document.querySelector(".shop-header p") || document.querySelector("p.sub");
  
  if (!catalog) return;
  catalog.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:60px;">Loading treasures...</div>`;

  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    allProducts = data || [];
    filteredProducts = [...allProducts];
  } catch (err) {
    catalog.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#dc2626;">Gagal memuat produk.</div>`;
    return;
  }

  page = 0;
  if (countEl) countEl.textContent = `Discover ${filteredProducts.length} preloved gems.`;
  renderPage(catalog);
  bindShopControls(catalog, countEl);
}

function renderPage(catalog) {
  const slice = filteredProducts.slice(0, (page + 1) * PAGE_SIZE);
  catalog.innerHTML = slice.map(productCardHTML).join("");

  catalog.querySelectorAll(".prod-card").forEach(card => {
    card.addEventListener("click", () => {
      setRouteParams({ productId: card.dataset.id });
      navigate("product-detail");
    });
  });
}

function productCardHTML(p) {
  const imgUrl = p.image_url || 'assets/chair.jpg';
  return `
    <div class="prod-card" data-id="${p.id}" style="cursor:pointer;">
      <img class="prod-img" src="${imgUrl}" alt="${p.title}" loading="lazy">
      <div class="prod-info">
        <span>${p.condition ?? "Excellent"} · ${p.category ?? "Furniture"}</span>
        <h3>${p.title}</h3>
        <strong>$${p.price}</strong>
      </div>
    </div>`;
}

function bindShopControls(catalog, countEl) {
  // Toggle Grid / List
  document.querySelectorAll("[data-view-mode]").forEach(btn => {
    btn.addEventListener("click", () => {
      currentView = btn.dataset.viewMode;
      document.querySelectorAll("[data-view-mode]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      catalog.className = `product-grid ${currentView === "list" ? " list-view" : ""}`;
    });
  });

  // Filter Event Listeners
  document.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => { chip.classList.toggle("active"); applyFilters(catalog, countEl); });
  });
  document.querySelectorAll(".custom-checkbox input").forEach(cb => {
    cb.addEventListener("change", () => applyFilters(catalog, countEl));
  });

  // Price Range Listeners
  const priceInputs = document.querySelectorAll('input[type="number"][placeholder="Min"], input[type="number"][placeholder="Max"]');
  priceInputs.forEach(input => input.addEventListener("input", () => applyFilters(catalog, countEl)));

  const sortSelect = document.querySelector(".sort-select");
  if (sortSelect) sortSelect.addEventListener("change", () => applyFilters(catalog, countEl));
}

function applyFilters(catalog, countEl) {
  let result = [...allProducts];

  // Kategori
  const checkedCats = Array.from(document.querySelectorAll(".custom-checkbox input:checked")).map(cb => cb.closest("label").textContent.trim());
  if (checkedCats.length > 0 && !checkedCats.includes("All Furniture")) {
    result = result.filter(p => checkedCats.some(c => p.category?.toLowerCase() === c.toLowerCase()));
  }

  // Kondisi
  const activeChips = Array.from(document.querySelectorAll(".chip.active")).map(chip => chip.textContent.trim());
  if (activeChips.length > 0) result = result.filter(p => activeChips.some(c => p.condition?.toLowerCase() === c.toLowerCase()));

  // Harga
  const minPrice = parseFloat(document.querySelector('input[placeholder="Min"]')?.value) || 0;
  const maxPrice = parseFloat(document.querySelector('input[placeholder="Max"]')?.value) || 999999;
  result = result.filter(p => p.price >= minPrice && p.price <= maxPrice);

  // Sorting
  const sortVal = document.querySelector(".sort-select")?.value;
  if (sortVal?.includes("Low to High")) result.sort((a, b) => a.price - b.price);
  else if (sortVal?.includes("High to Low")) result.sort((a, b) => b.price - a.price);

  filteredProducts = result;
  page = 0;
  if (countEl) countEl.textContent = `Discover ${filteredProducts.length} preloved gems.`;
  renderPage(catalog);
}