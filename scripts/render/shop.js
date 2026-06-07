// scripts/render/profile.js
import { getSupabaseClient } from "../supabaseClient.js";
import { navigate } from "../router.js";
import { logoutUser } from "../auth.js";
import { showToast } from "../ui.js";

// ─── Helper: sanitize string untuk mencegah XSS ───
function sanitize(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag] || tag));
}

export async function renderProfile() {
  const container = document.getElementById("router-view");
  if (!container) return;

  try {
    const supabase = await getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      navigate("home");
      return;
    }

    const fullName = user.user_metadata?.full_name || "User ReHome";
    const userEmail = user.email || "user@example.com";
    const joinDate = new Date(user.created_at).getFullYear();

    // ==========================================
    // 1. AMBIL / BUAT DATA PROFIL DARI DATABASE
    // ==========================================
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // Profil belum ada — insert record baru
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          full_name: fullName,
          description: 'Curator & Sustainability Advocate',
          location: 'Batam, Indonesia',
          impact_score: 450,
        }])
        .select()
        .single();
      profile = newProfile || {};
    }

    // ==========================================
    // 2. INJECT DATA KE DOM
    // ==========================================
    const displayName = profile.full_name || fullName;

    const initialEl   = document.getElementById("profile-initial");
    const nameDisplay = document.getElementById("profile-name-display");
    const emailDisplay = document.getElementById("profile-email-display");
    const joinEl      = document.getElementById("profile-join-date");

    if (initialEl)    initialEl.textContent    = displayName.charAt(0).toUpperCase();
    if (nameDisplay)  nameDisplay.textContent  = displayName;
    if (emailDisplay) emailDisplay.textContent = userEmail;
    if (joinEl)       joinEl.textContent       = `Member since ${joinDate}`;

    // Deskripsi + lokasi (cari <p> yang mengandung "Curator")
    const allP = container.querySelectorAll("p");
    const descDisplay = Array.from(allP).find(p => p.textContent.includes("Curator"));
    if (descDisplay) {
      descDisplay.innerHTML =
        `${sanitize(profile.description)} &bull; <span id="profile-location">${sanitize(profile.location)}</span>`;
    }

    // Impact Score — cari elemen yang menampilkan angka score
    const impactEl =
      document.querySelector(".impact-stats strong") ||
      document.querySelector(".impact-score");
    if (impactEl) {
      impactEl.textContent = (profile.impact_score || 0).toLocaleString();
    }

    // ==========================================
    // 3. SAVED ITEMS — fetch + render tab
    // ==========================================
    const { data: favorites } = await supabase
      .from('favorites')
      .select('product_id, products(*)')
      .eq('user_id', user.id);

    const favCount = favorites ? favorites.length : 0;

    // Update badge angka di tab "Saved Items"
    const savedTabBadge = document.querySelector('button[data-tab="saved"] span');
    if (savedTabBadge) savedTabBadge.textContent = favCount;

    // Render isi tab Saved Items
    const tabSaved = document.getElementById("tab-saved");
    if (tabSaved && favCount > 0) {
      tabSaved.innerHTML =
        `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:20px;">` +
        favorites.map(f => {
          const p = f.products;
          if (!p) return '';
          return `
            <div style="background:white;border-radius:12px;border:1px solid #e7e5e4;padding:16px;cursor:pointer;"
                 onclick="window.location.hash='product-detail?productId=${p.id}'">
              <img src="${sanitize(p.image_url)}"
                   style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;margin-bottom:12px;">
              <div style="font-weight:700;color:#1c1917;font-size:14px;">${sanitize(p.title)}</div>
              <div style="color:#3d5a30;font-weight:600;font-size:14px;margin-top:4px;">$${sanitize(String(p.price))}</div>
            </div>`;
        }).join('') +
        `</div>`;
    }

    // ==========================================
    // 4. EDIT PROFILE
    // ==========================================
    const editBtn = Array.from(container.querySelectorAll("button"))
      .find(b => b.textContent.trim().includes("Edit Profile"));

    if (editBtn) {
      editBtn.addEventListener("click", async () => {
        const newDesc = prompt("Update your description:", profile.description);
        const newLoc  = prompt("Update your location:",    profile.location);
        if (newDesc !== null && newLoc !== null) {
          const original = editBtn.textContent;
          editBtn.textContent = "Saving...";
          await supabase
            .from('profiles')
            .update({ description: newDesc, location: newLoc })
            .eq('id', user.id);
          showToast("Profile Updated!");
          editBtn.textContent = original;
          renderProfile(); // refresh tampilan
        }
      });
    }

    // ==========================================
    // 5. NAVIGASI TOMBOL HEADER (Seller / Settings)
    // ==========================================
    const btnNavs = document.querySelectorAll('button[data-route]');
    btnNavs.forEach(btn => {
      btn.addEventListener('click', () => {
        const route = btn.getAttribute('data-route');
        if (route) navigate(route);
      });
    });

    // ==========================================
    // 6. LOGIKA TAB
    // ==========================================
    const tabs     = document.querySelectorAll('.profile-tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', e => {
        // Reset semua tab
        tabs.forEach(t => {
          t.classList.remove('active');
          t.style.borderBottomColor = 'transparent';
          t.style.color = '#78716c';
          t.style.fontWeight = '600';
        });
        contents.forEach(c => c.style.display = 'none');

        // Handle klik pada child element seperti badge <span>
        const targetTab = e.target.closest('.profile-tab');
        if (!targetTab) return;

        targetTab.classList.add('active');
        targetTab.style.borderBottomColor = '#3d5a30';
        targetTab.style.color = '#1c1917';
        targetTab.style.fontWeight = '700';

        const contentEl = document.getElementById(`tab-${targetTab.getAttribute('data-tab')}`);
        if (contentEl) contentEl.style.display = 'block';
      });
    });

    // ==========================================
    // 7. PREFERENCES — sinkronisasi currency dari DB
    // ==========================================
    const prefSelects = document.querySelectorAll('#tab-preferences select');
    if (prefSelects.length > 0) {
      if (profile.currency) prefSelects[0].value = profile.currency;

      prefSelects[0].addEventListener('change', async e => {
        await supabase
          .from('profiles')
          .update({ currency: e.target.value })
          .eq('id', user.id);
        showToast("Preferences Saved!");
      });
    }

    // ==========================================
    // 8. LOGOUT
    // ==========================================
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