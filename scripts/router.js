import { showToast } from "./ui.js";

const viewCache = {};
// ── TAMBAHAN UNTUK MENYIMPAN DATA ANTAR HALAMAN ──
let routeParams = {}; 

export function setRouteParams(params) {
  routeParams = params;
}

export function getRouteParams() {
  return routeParams;
}
// ─────────────────────────────────────────────────

export async function navigate(route) {
  const container = document.getElementById("router-view");
  if (!container) return;

  // Ganti warna tombol nav
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.classList.toggle("active", button.dataset.route === route);
  });

  try {
    // Ambil HTML
    if (!viewCache[route]) {
      const response = await fetch(`views/${route}.html`);
      if (response.ok) viewCache[route] = await response.text();
      else viewCache[route] = `<div style="padding:100px;text-align:center;"><h2>Halaman belum dibuat</h2></div>`;
    }
    container.innerHTML = viewCache[route];
    window.scrollTo({ top: 0, behavior: "auto" });

    // Panggil JS Spesifik untuk halaman tersebut secara dinamis
    try {
      const module = await import(`./render/${route}.js`);
      // Ini otomatis membuat nama fungsi, misal: route "sell" -> "renderSell"
      const renderFunctionName = "render" + route.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
      if (module[renderFunctionName]) module[renderFunctionName]();
    } catch (e) {
      console.warn(`Info: Tidak ada file JS khusus untuk ${route}.js, tapi HTML tetap aman.`);
    }

    // Aktifkan semua tombol pindah halaman di HTML baru
    container.querySelectorAll("[data-route]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault(); 
        navigate(btn.dataset.route);
      });
    });

  } catch (error) {
    showToast("Gagal memuat halaman.");
  }
}

export const Maps = navigate;
export async function showApp(route = "home") {
  document.getElementById("login").hidden = true;
  document.getElementById("app").hidden = false;
  await navigate(route);
}