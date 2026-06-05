// scripts/render/shop.js
import { getSupabaseClient } from "../supabaseClient.js";
import { navigate, setRouteParams } from "../router.js";
import { showToast } from "../ui.js";

let allProducts = [], filteredProducts = [], currentView = "grid", page = 0;
const PAGE_SIZE = 9;
let favoriteIds = JSON.parse(localStorage.getItem("rehome_favorites") || "[]");

export async function renderShop() {
  const catalog = document.getElementById("shop-catalog") || document.querySelector(".product-grid");
  const countEl = document.querySelector(".shop-header p") || document.querySelector("p.sub");
  if (!catalog) return;
  catalog.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;">Loading treasures...</div>`;

  try {
    const supabase = await getSupabaseClient();
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    allProducts = data || []; filteredProducts = [...allProducts];
  } catch (err) { catalog.innerHTML = `<div style="color:red;">Error loading products.</div>`; return; }

  page = 0; renderPage(catalog, countEl); bindShopControls(catalog, countEl);
}

function renderPage(catalog, countEl) {
  if (countEl) countEl.textContent = `Discover ${filteredProducts.length} preloved gems.`;
  catalog.innerHTML = filteredProducts.slice(0, (page + 1) * PAGE_SIZE).map(p => {
    const isFav = favoriteIds.includes(p.id) ? "active" : "";
    return `
    <div class="prod-card" data-id="${p.id}" style="cursor:pointer; position:relative; overflow:hidden;">
      <button class="btn-favorite ${isFav}" title="Favorite">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
      </button>
      <img class="prod-img" src="${p.image_url || 'assets/chair.jpg'}" loading="lazy" style="border-radius:12px;">
      <div class="prod-info" style="margin-top:12px;">
        <span style="font-size:12px;color:#78716c;font-weight:600;">${p.condition ?? "Excellent"} · ${p.category ?? "Furniture"}</span>
        <h3 style="font-size:16px;margin:4px 0;">${p.title}</h3>
        <strong style="color:#3d5a30;">$${p.price}</strong>
      </div>
    </div>`;
  }).join("");

  catalog.querySelectorAll(".prod-card").forEach(card => {
    card.addEventListener("click", () => { setRouteParams({ productId: card.dataset.id }); navigate("product-detail"); });
  });

  catalog.querySelectorAll(".btn-favorite").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); const prodId = btn.closest(".prod-card").dataset.id;
      btn.classList.toggle("active");
      if (btn.classList.contains("active")) { favoriteIds.push(prodId); showToast("Added to favorites!"); } 
      else { favoriteIds = favoriteIds.filter(id => id !== prodId); showToast("Removed from favorites."); }
      localStorage.setItem("rehome_favorites", JSON.stringify(favoriteIds));
    });
  });
}

function bindShopControls(catalog, countEl) {
  const nativeSelect = document.querySelector(".sort-select");
  if (nativeSelect && !document.querySelector(".custom-sort-wrapper")) {
     nativeSelect.style.display = "none";
     
     const wrapper = document.createElement("div");
     wrapper.className = "custom-sort-wrapper";
     wrapper.style.cssText = "position: relative; display: inline-block; cursor: pointer; user-select: none;";
     
     const selectedText = document.createElement("div");
     selectedText.innerHTML = `<span style="margin-right:8px;">${nativeSelect.options[nativeSelect.selectedIndex]?.text || 'Sort by'}</span> <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l5 5 5-5"/></svg>`;
     selectedText.style.cssText = "font-weight: 700; color: #1c1917; display: flex; align-items: center; font-size: 15px;";
     
     const optionsList = document.createElement("div");
     optionsList.style.cssText = "position: absolute; top: 100%; right: 0; background: white; border: 1px solid #c9c8bd; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 160px; z-index: 100; display: none; flex-direction: column; overflow: hidden; margin-top: 8px;";
     
     Array.from(nativeSelect.options).forEach(opt => {
        const optionEl = document.createElement("div");
        optionEl.textContent = opt.text;
        optionEl.style.cssText = "padding: 10px 16px; font-size: 14px; font-weight: 500; color: #1c1917; transition: 0.1s;";
        optionEl.onmouseover = () => { optionEl.style.background = "#3b82f6"; optionEl.style.color = "white"; };
        optionEl.onmouseout = () => { optionEl.style.background = "transparent"; optionEl.style.color = "#1c1917"; };
        optionEl.onclick = (e) => {
           e.stopPropagation();
           nativeSelect.value = opt.value;
           selectedText.querySelector("span").textContent = opt.text;
           optionsList.style.display = "none";
           applyFilters(catalog, countEl); 
        };
        optionsList.appendChild(optionEl);
     });
     
     wrapper.appendChild(selectedText); wrapper.appendChild(optionsList);
     nativeSelect.parentNode.insertBefore(wrapper, nativeSelect.nextSibling);
     
     selectedText.onclick = (e) => { e.stopPropagation(); optionsList.style.display = optionsList.style.display === "none" ? "flex" : "none"; };
     document.addEventListener("click", () => optionsList.style.display = "none");
  }

  // PERBAIKAN: JANGAN BACA SVG DARI DROPDOWN SORT BY
  const svgs = document.querySelectorAll('.shop-header svg, .view-toggle svg');
  svgs.forEach(svg => {
    if (svg.closest('.custom-sort-wrapper')) return; // Abaikan SVG Sort By
    if (svg.innerHTML.includes('rect') && svg.querySelectorAll('rect').length >= 4) svg.closest('button, div').dataset.viewMode = 'grid';
    else if (svg.innerHTML.includes('line') || svg.innerHTML.includes('path')) svg.closest('button, div').dataset.viewMode = 'list';
  });

  document.querySelectorAll("[data-view-mode]").forEach(btn => {
    btn.style.cursor = "pointer";
    btn.addEventListener("click", () => {
      currentView = btn.dataset.viewMode;
      document.querySelectorAll("[data-view-mode]").forEach(b => b.style.opacity = "0.4");
      btn.style.opacity = "1"; btn.style.background = currentView === "grid" ? "#f5f5f4" : "transparent";
      catalog.className = `product-grid ${currentView === "list" ? " list-view" : ""}`;
    });
  });

  const rMin = document.querySelector(".range-min"), rMax = document.querySelector(".range-max"), iMin = document.getElementById("input-min"), iMax = document.getElementById("input-max"), track = document.querySelector(".slider-track");
  function updateTrack() { if(track && rMin && rMax) { track.style.left = (rMin.value/5000)*100 + "%"; track.style.right = 100 - (rMax.value/5000)*100 + "%"; } }
  
  if (rMin && rMax) {
    updateTrack();
    rMin.addEventListener("input", () => { if(parseInt(rMin.value) > parseInt(rMax.value)-100) rMin.value = parseInt(rMax.value)-100; iMin.value = rMin.value; updateTrack(); applyFilters(catalog, countEl); });
    rMax.addEventListener("input", () => { if(parseInt(rMax.value) < parseInt(rMin.value)+100) rMax.value = parseInt(rMin.value)+100; iMax.value = rMax.value; updateTrack(); applyFilters(catalog, countEl); });
  }
  if (iMin && iMax) {
    iMin.addEventListener("change", () => { rMin.value = iMin.value; updateTrack(); applyFilters(catalog, countEl); });
    iMax.addEventListener("change", () => { rMax.value = iMax.value; updateTrack(); applyFilters(catalog, countEl); });
  }
  document.querySelectorAll(".chip, .custom-checkbox input").forEach(el => el.addEventListener("change", () => applyFilters(catalog, countEl)));
  document.querySelectorAll(".chip").forEach(el => el.addEventListener("click", () => { el.classList.toggle("active"); applyFilters(catalog, countEl); }));
}

function applyFilters(catalog, countEl) {
  let res = [...allProducts];
  const cats = Array.from(document.querySelectorAll(".custom-checkbox input:checked")).map(cb => cb.closest("label").textContent.trim());
  if (cats.length && !cats.includes("All Furniture")) res = res.filter(p => cats.some(c => p.category?.toLowerCase() === c.toLowerCase()));
  const conds = Array.from(document.querySelectorAll(".chip.active")).map(c => c.textContent.trim());
  if (conds.length) res = res.filter(p => conds.some(c => p.condition?.toLowerCase() === c.toLowerCase()));
  const min = parseFloat(document.getElementById("input-min")?.value) || 0, max = parseFloat(document.getElementById("input-max")?.value) || 999999;
  res = res.filter(p => p.price >= min && p.price <= max);
  const sort = document.querySelector(".sort-select")?.value;
  if (sort?.includes("Low to High")) res.sort((a, b) => a.price - b.price); else if (sort?.includes("High to Low")) res.sort((a, b) => b.price - a.price);
  filteredProducts = res; renderPage(catalog, countEl);
}