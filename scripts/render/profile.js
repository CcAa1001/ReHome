// scripts/render/profile.js
import { getSupabaseClient } from "../supabaseClient.js";
import { navigate } from "../router.js";
import { logoutUser } from "../auth.js";
import { showToast } from "../ui.js";

function sanitize(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag] || tag));
}

export async function renderProfile() {
  const container = document.getElementById("router-view");
  if (!container) return;
  // Biarkan HTML dirender oleh router (menggunakan views/profile.html yang sudah Bos miliki)

  try {
    const supabase = await getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      navigate("home");
      return;
    }

    // ==========================================
    // 1. SINKRONISASI DATA PROFIL (BIO & SETTINGS)
    // ==========================================
    let fullName = user.user_metadata?.full_name || "User ReHome";
    const userEmail = user.email || "user@example.com";
    const joinDate = new Date(user.created_at).getFullYear();

    // Cek apakah user sudah punya data di tabel 'profiles', jika belum, buatkan (Upsert)
    let { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    
    if (!profile) {
        const { data: newProfile } = await supabase.from('profiles').insert({
            id: user.id, full_name: fullName, description: 'Curator & Sustainability Advocate', location: 'Batam, Indonesia', impact_score: 450
        }).select().single();
        profile = newProfile || {};
    }

    // Tangkap Elemen HTML Header Profil
    const initialEl = document.getElementById("profile-initial");
    const nameDisplay = document.getElementById("profile-name-display");
    const emailDisplay = document.getElementById("profile-email-display");
    const joinEl = document.getElementById("profile-join-date");
    
    // Elemen Bio & Lokasi tambahan (Cari di HTML Bos yang menampilkan deskripsi)
    const descElements = container.querySelectorAll("p");
    let descDisplay = Array.from(descElements).find(p => p.textContent.includes("Curator")); // Mencari elemen deskripsi
    const locationDisplay = document.getElementById("profile-location");

    // Suntikkan Data
    if (initialEl) initialEl.textContent = (profile.full_name || fullName).charAt(0).toUpperCase();
    if (nameDisplay) nameDisplay.textContent = profile.full_name || fullName;
    if (emailDisplay) emailDisplay.textContent = userEmail;
    if (joinEl) joinEl.textContent = `Member since ${joinDate}`;
    if (descDisplay) descDisplay.innerHTML = `${sanitize(profile.description)} &bull; <span id="profile-location">${sanitize(profile.location)}</span>`;

    // ==========================================
    // 2. SINKRONISASI IMPACT SCORE
    // ==========================================
    const impactBoxes = container.querySelectorAll(".impact-score, div");
    const impactScoreDisplay = Array.from(impactBoxes).find(div => div.textContent.includes("2,450") || div.textContent.includes("450"));
    if (impactScoreDisplay) {
        impactScoreDisplay.textContent = (profile.impact_score || 0).toLocaleString();
    }

    // ==========================================
    // 3. SINKRONISASI SAVED ITEMS & TAB NUMBERS
    // ==========================================
    const { data: favorites } = await supabase.from('favorites').select('product_id, products(*)').eq('user_id', user.id);
    const favCount = favorites ? favorites.length : 0;
    
    // Update Angka di Tab "Saved Items"
    const savedTabBtn = document.querySelector('button[data-tab="saved"] span');
    if (savedTabBtn) savedTabBtn.textContent = favCount;

    // Render Isi Tab Saved Items
    const tabSaved = document.getElementById("tab-saved");
    if (tabSaved) {
        if (favCount > 0) {
            tabSaved.innerHTML = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px;">` + 
            favorites.map(f => {
                const p = f.products;
                if(!p) return '';
                return `
                <div style="background: white; border-radius: 12px; border: 1px solid #e7e5e4; padding: 16px; cursor: pointer;" onclick="window.location.hash='product-detail?productId=${p.id}'">
                    <img src="${p.image_url}" style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 8px; margin-bottom: 12px;">
                    <div style="font-weight: 700; color: #1c1917; font-size: 14px;">${sanitize(p.title)}</div>
                    <div style="color: #3d5a30; font-weight: 600; font-size: 14px; margin-top: 4px;">$${p.price}</div>
                </div>`;
            }).join('') + `</div>`;
        }
    }

    // ==========================================
    // 4. MENGHIDUPKAN TOMBOL EDIT & SETTINGS
    // ==========================================
    const editBtn = Array.from(container.querySelectorAll("button")).find(b => b.textContent.includes("Edit Profile"));
    if (editBtn) {
        editBtn.addEventListener("click", async () => {
            const newDesc = prompt("Update your description:", profile.description);
            const newLoc = prompt("Update your location:", profile.location);
            if (newDesc !== null && newLoc !== null) {
                editBtn.textContent = "Saving...";
                await supabase.from('profiles').update({ description: newDesc, location: newLoc }).eq('id', user.id);
                showToast("Profile Updated!");
                renderProfile(); // Refresh
            }
        });
    }

    // Tombol Navigasi Header (Seller Dashboard & Settings)
    const btnNavs = document.querySelectorAll('button[data-route]');
    btnNavs.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetRoute = btn.getAttribute('data-route');
        if (targetRoute) navigate(targetRoute);
      });
    });

    // ==========================================
    // LOGIKA PERGANTIAN TAB (MAIN CONTENT)
    // ==========================================
    const tabs = document.querySelectorAll('.profile-tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        tabs.forEach(t => {
          t.classList.remove('active');
          t.style.borderBottomColor = 'transparent';
          t.style.color = '#78716c';
          t.style.fontWeight = '600';
        });
        contents.forEach(c => c.style.display = 'none');

        const targetTab = e.target.closest('.profile-tab');
        if (!targetTab) return;

        targetTab.classList.add('active');
        targetTab.style.borderBottomColor = '#3d5a30';
        targetTab.style.color = '#1c1917';
        targetTab.style.fontWeight = '700';

        const contentId = `tab-${targetTab.getAttribute('data-tab')}`;
        const contentEl = document.getElementById(contentId);
        if (contentEl) contentEl.style.display = 'block';
      });
    });

    // ==========================================
    // PREFERENCES SINKRONISASI
    // ==========================================
    const prefSelects = document.querySelectorAll('#tab-preferences select');
    if (prefSelects.length > 0) {
        // Set nilai awal dari DB
        if (profile.currency) prefSelects[0].value = profile.currency;
        
        // Simpan otomatis saat diubah
        prefSelects[0].addEventListener('change', async (e) => {
            await supabase.from('profiles').update({ currency: e.target.value }).eq('id', user.id);
            showToast("Preferences Saved!");
        });
    }

    // ==========================================
    // LOGOUT
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