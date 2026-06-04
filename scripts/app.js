// scripts/app.js
import { bindLoginPage } from "./render/login.js";
import { navigate } from "./router.js";
import { logoutUser } from "./auth.js"; // Import koneksi logout asli

function boot() {
  // 1. Aktifkan fitur koneksi Database Login & Register
  bindLoginPage();

  // 2. Aktifkan semua tombol menu navigasi di header & footer
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      navigate(button.dataset.route);
    });
  });

  // 3. Aktifkan tombol Logout (Terhubung ke Supabase)
  const logoutBtn = document.querySelector("[data-logout]");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await logoutUser(); // Hapus sesi di database dan localStorage
        
        // Kembalikan UI ke halaman login
        document.getElementById("app").hidden = true;
        document.getElementById("login").hidden = false;
        
        // Bersihkan hash di URL agar terlihat bersih
        window.location.hash = "";
      } catch (error) {
        console.error("Logout failed:", error);
        alert("Gagal logout dari server. Silakan coba lagi.");
      }
    });
  }
}

// Inisialisasi Aplikasi
boot();