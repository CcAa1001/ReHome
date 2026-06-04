// scripts/render/home.js
import { navigate } from "../router.js";

export async function renderHome() {
  // Logic lama dimatikan. HTML statis di views/home.html yang akan memegang kendali penuh 
  // demi kestabilan desain 100% pixel-perfect.
  
  const container = document.getElementById("router-view");
  if (!container) return;

  // Cukup aktifkan tombol-tombol navigasi di dalam home
  container.querySelectorAll("[data-route]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      navigate(btn.dataset.route);
    });
  });
}