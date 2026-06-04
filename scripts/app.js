// scripts/app.js
import { bindLoginPage } from "./render/login.js";
import { navigate } from "./router.js";
import { logoutUser } from "./auth.js";
import { getSupabaseClient } from "./supabaseClient.js";

// FUNGSI GLOBAL: Mengubah angka keranjang di Header sesuai isi Database
// FUNGSI GLOBAL: Mengubah angka keranjang di Header sesuai isi Database
window.updateGlobalCartBadge = async function() {
  try {
    const supabase = await getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    let totalItems = 0;
    if (session) {
      // PERBAIKAN: Ambil "quantity" lalu jumlahkan semuanya!
      const { data, error } = await supabase.from('cart_items').select('quantity').eq('user_id', session.user.id);
      if (!error && data) {
         totalItems = data.reduce((sum, item) => sum + item.quantity, 0);
      }
    }

    document.querySelectorAll('nav [data-route="cart"], header [data-route="cart"], .app-nav [data-route="cart"]').forEach(icon => {
      let badge = icon.querySelector(".cart-badge") || icon.querySelector(".badge") || icon.querySelector("span");
      
      if (!badge) {
         icon.style.position = "relative";
         icon.insertAdjacentHTML('beforeend', `<span class="cart-badge">${totalItems}</span>`);
         badge = icon.querySelector(".cart-badge");
      } else {
         badge.textContent = totalItems;
      }
      
      badge.style.position = "absolute";
      badge.style.top = "-5px";
      badge.style.right = "-10px";
      badge.style.background = "#dc2626";
      badge.style.color = "white";
      badge.style.fontSize = "10px";
      badge.style.padding = "2px 6px";
      badge.style.borderRadius = "99px";
    });
  } catch (err) {
    console.error("Gagal update badge:", err);
  }
};

async function boot() {
  // 1. Tembak database untuk perbaiki angka keranjang saat web pertama dibuka
  await window.updateGlobalCartBadge(); 

  // 2. Bind form login & register
  bindLoginPage();

  // 3. Cek Session & Auto-Login
  const supabase = await getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
      document.getElementById("login").hidden = true;
      document.getElementById("app").hidden = false;
      const lastRoute = localStorage.getItem('rehome_current_route') || "home";
      navigate(lastRoute);
  } else {
      document.getElementById("app").hidden = true;
      document.getElementById("login").hidden = false;
  }

  // 4. Tombol Logout
  const logoutBtn = document.querySelector("[data-logout]");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await logoutUser();
      document.getElementById("app").hidden = true;
      document.getElementById("login").hidden = false;
      window.location.hash = "";
    });
  }
}

boot();