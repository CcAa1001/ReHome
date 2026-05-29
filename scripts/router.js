// scripts/router.js
import { elements } from "./dom.js";
import { getSession } from "./storage.js";
import { showToast } from "./ui.js";

// ── IMPORT SEMUA RENDERER DI SINI ──
import { renderHome } from "./render/home.js";
import { renderProducts } from "./render/products.js";
import { renderListings } from "./render/listings.js";
import { renderHistory } from "./render/history.js";
import { renderCurated } from "./render/curated.js";

// Cache (Ingatan) agar HTML tidak didownload ulang
const viewCache = {};

export async function navigate(route, params = {}) {
  const container = document.getElementById("router-view");
  if (!container) return;

  // 1. Ganti warna tombol nav yang aktif
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.classList.toggle("active", button.dataset.route === route);
  });

  // 2. Ambil HTML dari folder views/
  try {
    if (!viewCache[route]) {
      const response = await fetch(`views/${route}.html`);
      
      if (response.ok) {
        viewCache[route] = await response.text();
      } else {
        viewCache[route] = `<div class="page-shell" style="padding: 100px; text-align: center;">
          <h2>Halaman "${route}" belum dibuat di folder views/</h2>
        </div>`;
      }
    }
    
    // 3. Suntikkan HTML ke layar
    container.innerHTML = viewCache[route];
    
    // Scroll otomatis ke atas
    window.scrollTo({ top: 0, behavior: "auto" });

    // 4. Panggil ulang logika JavaScript khusus
    triggerViewScripts(route);

  } catch (error) {
    console.error("Gagal memuat halaman:", error);
    showToast("Gagal memuat halaman.");
  }
}

// ── BINDING SCRIPT DINAMIS ──
function triggerViewScripts(route) {
  if (route === "home") {
    renderHome();
  } else if (route === "shop") {
    renderProducts();
  } else if (route === "seller") {
    renderListings();
  } else if (route === "profile") {
    renderHistory(); 
  } else if (route === "curated") {
    renderCurated(); 
  }
}

export const Maps = navigate;

export async function showApp(route = "home", renderAll) {
  document.getElementById("login").hidden = true;
  document.getElementById("app").hidden = false;
  await navigate(route); // Langsung arahkan ke halaman utama
}