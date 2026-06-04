// scripts/router.js
import { showToast } from "./ui.js";

// Simpan parameter (seperti ID Produk) di LocalStorage agar tidak hilang
let routeParams = JSON.parse(localStorage.getItem('rehome_route_params')) || {};

export function setRouteParams(params) {
  routeParams = params;
  localStorage.setItem('rehome_route_params', JSON.stringify(params));
}

export function getRouteParams() {
  return routeParams;
}

const viewCache = {};

// ── GLOBAL EVENT DELEGATION ──────────────────────────────────────────────
// Menangkap SEMUA klik pada tombol navigasi (Header, Footer, Menu, Halaman)
document.addEventListener("click", (e) => {
  const navBtn = e.target.closest("[data-route]");
  if (navBtn) {
    e.preventDefault();
    navigate(navBtn.dataset.route);
  }
});
// ─────────────────────────────────────────────────────────────────────────

export async function navigate(route) {
  const container = document.getElementById("router-view");
  if (!container) return;

  // Simpan rute terakhir yang dikunjungi
  localStorage.setItem('rehome_current_route', route);

  // Ganti warna tombol nav menjadi aktif
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.classList.toggle("active", button.dataset.route === route);
  });

  try {
    // 1. Muat HTML
    if (!viewCache[route]) {
      const response = await fetch(`views/${route}.html`);
      if (response.ok) viewCache[route] = await response.text();
      else viewCache[route] = `<div style="padding:100px;text-align:center;"><h2>Halaman belum dibuat</h2></div>`;
    }
    container.innerHTML = viewCache[route];
    window.scrollTo({ top: 0, behavior: "auto" });

    // 2. Panggil JS Spesifik Halaman (jika ada)
    try {
      const module = await import(`./render/${route}.js`);
      const renderFunctionName = "render" + route.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
      if (module[renderFunctionName]) module[renderFunctionName]();
    } catch (e) {
      console.warn(`Info: Tidak ada file JS khusus untuk ${route}.js, tapi HTML aman.`);
    }

  } catch (error) {
    showToast("Gagal memuat halaman.");
  }
}

export const Maps = navigate;

export async function showApp(route) {
  document.getElementById("login").hidden = true;
  document.getElementById("app").hidden = false;
  
  // Jika parameter kosong, panggil rute terakhir (mencegah auto balik home)
  const targetRoute = route || localStorage.getItem('rehome_current_route') || "home";
  await navigate(targetRoute);
}