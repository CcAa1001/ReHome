// scripts/render/shop.js
import { getSupabaseClient } from "../supabaseClient.js";
import { navigate, setRouteParams } from "../router.js";
import { showToast } from "../ui.js";

let allProducts = [];
let filteredProducts = [];
let currentView = "grid";
let page = 0;
const PAGE_SIZE = 9;
let favoriteIds = JSON.parse(localStorage.getItem("rehome_favorites") || "[]");

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
    catalog.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#dc2626;">Gagal memuat produk.</div>`; return;
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

  catalog.querySelectorAll(".btn-favorite").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); 
      const card = btn.closest(".prod-card");
      const prodId = card.dataset.id;
      btn.classList.toggle("active");
      if (btn.classList.contains("active")) {
        if (!favoriteIds.includes(prodId)) favoriteIds.push(prodId);
        showToast("Added to favorites!");
      } else {
        favoriteIds = favoriteIds.filter(id => id !== prodId);
        showToast("Removed from favorites.");
      }
      localStorage.setItem("rehome_favorites", JSON.stringify(favoriteIds));
    });
  });
}

function productCardHTML(p) {
  const imgUrl = p.image_url || 'assets/chair.jpg';
  const isActiveClass = favoriteIds.includes(p.id) ? "active" : "";
  return `
    <div class="prod-card" data-id="${p.id}" style="cursor:pointer; position:relative; overflow:hidden;">
      <button class="btn-favorite ${isActiveClass}" title="Favorite">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
      </button>
      <img class="prod-img" src="${imgUrl}" alt="${p.title}" loading="lazy" style="border-radius:12px;">
      <div class="prod-info" style="margin-top:12px;">
        <span style="font-size:12px; color:#78716c; text-transform:uppercase; font-weight:600;">
          ${p.condition ?? "Excellent"} · ${p.category ?? "Furniture"}
        </span>
        <h3 style="font-size:16px; margin:4px 0;">${p.title}</h3>
        <strong style="color:#3d5a30;">$${p.price}</strong>
      </div>
    </div>`;
}

function bindShopControls(catalog, countEl) {
  // --- KECERDASAN DETEKSI TOMBOL GRID & LIST ---
  const svgs = document.querySelectorAll('.shop-header svg, .view-toggle svg, button svg, div svg');
  svgs.forEach(svg => {
    // Jika bentuknya kotak-kotak (grid)
    if (svg.innerHTML.includes('rect') && svg.querySelectorAll('rect').length >= 4) {
       svg.closest('button, div').dataset.viewMode = 'grid';
    }
    // Jika bentuknya garis-garis (list)
    else if (svg.innerHTML.includes('line') || svg.innerHTML.includes('path')) {
       svg.closest('button, div').dataset.viewMode = 'list';
    }
  });

  // Eksekusi klik untuk merubah UI
  document.querySelectorAll("[data-view-mode]").forEach(btn => {
    btn.style.cursor = "pointer";
    btn.addEventListener("click", () => {
      currentView = btn.dataset.viewMode;
      // Beri efek transparansi pada tombol yang tidak aktif
      document.querySelectorAll("[data-view-mode]").forEach(b => b.style.opacity = "0.4");
      btn.style.opacity = "1";
      btn.style.background = currentView === "grid" ? "#f5f5f4" : "transparent"; // Efek aktif
      
      // Ubah susunan produk!
      catalog.className = `product-grid ${currentView === "list" ? " list-view" : ""}`;
    });
  });

  document.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => { chip.classList.toggle("active"); applyFilters(catalog, countEl); });
  });
  document.querySelectorAll(".custom-checkbox input").forEach(cb => {
    cb.addEventListener("change", () => applyFilters(catalog, countEl));
  });

  // Slider Logic
  const rangeMin = document.querySelector(".range-min");
  const rangeMax = document.querySelector(".range-max");
  const inputMin = document.getElementById("input-min");
  const inputMax = document.getElementById("input-max");
  const sliderTrack = document.querySelector(".slider-track");
  const priceGap = 100;

  function updateSliderTrack() {
    if(!rangeMin || !rangeMax || !sliderTrack) return;
    const maxVal = parseInt(rangeMin.max);
    const minPercent = (parseInt(rangeMin.value) / maxVal) * 100;
    const maxPercent = 100 - ((parseInt(rangeMax.value) / maxVal) * 100);
    sliderTrack.style.left = minPercent + "%"; sliderTrack.style.right = maxPercent + "%";
  }

  if (rangeMin && rangeMax) {
    updateSliderTrack();
    rangeMin.addEventListener("input", (e) => {
      let minVal = parseInt(e.target.value); let maxVal = parseInt(rangeMax.value);
      if (maxVal - minVal < priceGap) { rangeMin.value = maxVal - priceGap; minVal = rangeMin.value; }
      if (inputMin) inputMin.value = minVal;
      updateSliderTrack(); applyFilters(catalog, countEl);
    });
    rangeMax.addEventListener("input", (e) => {
      let minVal = parseInt(rangeMin.value); let maxVal = parseInt(e.target.value);
      if (maxVal - minVal < priceGap) { rangeMax.value = minVal + priceGap; maxVal = rangeMax.value; }
      if (inputMax) inputMax.value = maxVal;
      updateSliderTrack(); applyFilters(catalog, countEl);
    });
  }

  if (inputMin && inputMax) {
    inputMin.addEventListener("change", (e) => {
      let val = parseInt(e.target.value) || 0;
      if (rangeMin) { rangeMin.value = val; updateSliderTrack(); }
      applyFilters(catalog, countEl);
    });
    inputMax.addEventListener("change", (e) => {
      let val = parseInt(e.target.value) || 5000;
      if (rangeMax) { rangeMax.value = val; updateSliderTrack(); }
      applyFilters(catalog, countEl);
    });
  }

  const sortSelect = document.querySelector(".sort-select");
  if (sortSelect) sortSelect.addEventListener("change", () => applyFilters(catalog, countEl));
}

function applyFilters(catalog, countEl) {
  let result = [...allProducts];

  const checkedCats = Array.from(document.querySelectorAll(".custom-checkbox input:checked")).map(cb => cb.closest("label").textContent.trim());
  if (checkedCats.length > 0 && !checkedCats.includes("All Furniture")) { result = result.filter(p => checkedCats.some(c => p.category?.toLowerCase() === c.toLowerCase())); }

  const activeChips = Array.from(document.querySelectorAll(".chip.active")).map(chip => chip.textContent.trim());
  if (activeChips.length > 0) result = result.filter(p => activeChips.some(c => p.condition?.toLowerCase() === c.toLowerCase()));

  const minPrice = parseFloat(document.getElementById("input-min")?.value) || 0;
  const maxPrice = parseFloat(document.getElementById("input-max")?.value) || 999999;
  result = result.filter(p => p.price >= minPrice && p.price <= maxPrice);

  const sortVal = document.querySelector(".sort-select")?.value;
  if (sortVal?.includes("Low to High")) result.sort((a, b) => a.price - b.price);
  else if (sortVal?.includes("High to Low")) result.sort((a, b) => b.price - a.price);

  filteredProducts = result;
  page = 0;
  if (countEl) countEl.textContent = `Discover ${filteredProducts.length} preloved gems.`;
  renderPage(catalog);
}