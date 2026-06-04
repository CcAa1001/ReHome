// scripts/app.js
import { bindLoginPage } from "./render/login.js";
import { navigate } from "./router.js";
import { logoutUser } from "./auth.js";
import { getSupabaseClient } from "./supabaseClient.js"; // ← add this import

async function boot() {  // ← single async function, not nested

  // 1. Check for existing session FIRST (handles Google OAuth redirect)
  const supabase = await getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    // User is already logged in (e.g. returned from Google OAuth)
    document.getElementById("login").hidden = true;
    document.getElementById("app").hidden = false;
    navigate("home");
    // Don't return — still need to bind nav buttons and logout below
  } else {
    // No session → show login page
    bindLoginPage();
  }

  // 2. Listen for future auth changes (login / logout events)
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      document.getElementById("login").hidden = true;
      document.getElementById("app").hidden = false;
      navigate("home");
    } else {
      document.getElementById("app").hidden = true;
      document.getElementById("login").hidden = false;
      bindLoginPage();
    }
  });

  // 3. Bind all navigation buttons
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      navigate(button.dataset.route);
    });
  });

  // 4. Bind logout button
  const logoutBtn = document.querySelector("[data-logout]");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await logoutUser();
        document.getElementById("app").hidden = true;
        document.getElementById("login").hidden = false;
        window.location.hash = "";
      } catch (error) {
        console.error("Logout failed:", error);
        alert("Gagal logout dari server. Silakan coba lagi.");
      }
    });
  }

  
  async function handleLogoutRoute() {
    if (window.location.hash === "#logout") {
      try {
        await logoutUser();
        document.getElementById("app").hidden = true;
        document.getElementById("login").hidden = false;
        window.location.hash = "";
      } catch (error) {
        console.error("Logout failed:", error);
      }
    }
  }

  handleLogoutRoute();
  window.addEventListener("hashchange", handleLogoutRoute);
}

boot();