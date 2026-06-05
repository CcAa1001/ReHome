// scripts/render/profile.js
import { getSupabaseClient } from "../supabaseClient.js";
import { navigate } from "../router.js";
import { logoutUser } from "../auth.js";

export async function renderProfile() {
  try {
    const supabase = await getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      navigate("home");
      return;
    }

    // Ekstrak Data User
    const fullName = user.user_metadata?.full_name || "User ReHome";
    const userEmail = user.email || "user@example.com";
    const joinDate = new Date(user.created_at).getFullYear();

    // Tangkap Elemen HTML
    const initialEl = document.getElementById("profile-initial");
    const nameDisplay = document.getElementById("profile-name-display");
    const emailDisplay = document.getElementById("profile-email-display");
    const joinEl = document.getElementById("profile-join-date");

    // Suntikkan Data
    if (initialEl) initialEl.textContent = fullName.charAt(0).toUpperCase();
    if (nameDisplay) nameDisplay.textContent = fullName;
    if (emailDisplay) emailDisplay.textContent = userEmail;
    if (joinEl) joinEl.textContent = `Member since ${joinDate}`;

    // =====================================
    // LOGIKA PERGANTIAN TAB (MAIN CONTENT)
    // =====================================
    const tabs = document.querySelectorAll('.profile-tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        // Matikan semua tab & sembunyikan semua konten
        tabs.forEach(t => {
          t.classList.remove('active');
          t.style.borderBottomColor = 'transparent';
          t.style.color = '#78716c';
          t.style.fontWeight = '600';
        });
        contents.forEach(c => c.style.display = 'none');

        // Hidupkan tab yang di-klik
        // e.target bisa kena <span> badge di dalam button — naik ke button
        const targetTab = e.target.closest('.profile-tab');
        if (!targetTab) return;

        targetTab.classList.add('active');
        targetTab.style.borderBottomColor = '#3d5a30';
        targetTab.style.color = '#1c1917';
        targetTab.style.fontWeight = '700';

        // Munculkan kontennya
        const contentId = `tab-${targetTab.getAttribute('data-tab')}`;
        const contentEl = document.getElementById(contentId);
        if (contentEl) contentEl.style.display = 'block';
      });
    });

    // =====================================
    // NAVIGASI TOMBOL ATAS KANAN
    // =====================================
    const btnNavs = document.querySelectorAll('button[data-route]');
    btnNavs.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetRoute = btn.getAttribute('data-route');
        if (targetRoute) navigate(targetRoute);
      });
    });

    // Fungsikan Tombol Sign Out
    const logoutBtn = document.getElementById("profile-logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        await logoutUser();
        localStorage.removeItem('rehome_current_route');

        document.getElementById("app").hidden = true;
        document.getElementById("login").hidden = false;
        window.location.hash = "";
      });
    }

  } catch (err) {
    console.error("Error memuat halaman profil:", err);
  }
}