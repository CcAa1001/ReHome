// scripts/app.js
import { bindLoginPage } from "./render/login.js";
import { navigate } from "./router.js";

function boot() {
  // 1. Aktifkan fitur bypass Login
  bindLoginPage();

  // 2. Aktifkan semua tombol menu navigasi di header & footer
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      navigate(button.dataset.route);
    });
  });

  // 3. Aktifkan tombol Logout
  const logoutBtn = document.querySelector("[data-logout]");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      document.getElementById("app").hidden = true;
      document.getElementById("login").hidden = false;
    });
  }
}

boot();