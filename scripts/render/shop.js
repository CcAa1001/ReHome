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

// ─── Helper: format tanggal ───
function formatDate(isoString) {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

// ─── Helper: status badge warna ───
function statusBadge(status) {
  const colors = {
    pending:   { bg: '#fef9c3', color: '#854d0e' },
    paid:      { bg: '#dcfce7', color: '#166534' },
    shipped:   { bg: '#dbeafe', color: '#1e40af' },
    delivered: { bg: '#f0fdf4', color: '#15803d' },
    cancelled: { bg: '#fee2e2', color: '#991b1b' },
  };
  const c = colors[status] || { bg: '#f5f5f4', color: '#57534e' };
  return `<span style="
    background:${c.bg};color:${c.color};
    padding:2px 10px;border-radius:99px;
    font-size:12px;font-weight:600;text-transform:capitalize;
  ">${sanitize(status)}</span>`;
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

    const initialEl    = document.getElementById("profile-initial");
    const nameDisplay  = document.getElementById("profile-name-display");
    const emailDisplay = document.getElementById("profile-email-display");
    const joinEl       = document.getElementById("profile-join-date");

    if (initialEl)    initialEl.textContent    = displayName.charAt(0).toUpperCase();
    if (nameDisplay)  nameDisplay.textContent  = displayName;
    if (emailDisplay) emailDisplay.textContent = userEmail;
    if (joinEl)       joinEl.textContent       = `Member since ${joinDate}`;

    const allP = container.querySelectorAll("p");
    const descDisplay = Array.from(allP).find(p => p.textContent.includes("Curator"));
    if (descDisplay) {
      descDisplay.innerHTML =
        `${sanitize(profile.description)} &bull; <span id="profile-location">${sanitize(profile.location)}</span>`;
    }

    const impactEl =
      document.querySelector(".impact-stats strong") ||
      document.querySelector(".impact-score");
    if (impactEl) {
      impactEl.textContent = (profile.impact_score || 0).toLocaleString();
    }

    // ==========================================
    // 3. PURCHASE HISTORY
    // ==========================================
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        total,
        created_at,
        order_items (
          id,
          title,
          quantity,
          price,
          product_id
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersError) console.error('Purchase history error:', ordersError);

    // Update badge
    const purchaseTabBadge = document.querySelector('button[data-tab="purchases"] span');
    if (purchaseTabBadge) purchaseTabBadge.textContent = orders ? orders.length : 0;

    // Render tab
    const tabPurchases = document.getElementById("tab-purchases");
    if (tabPurchases) {
      if (!orders || orders.length === 0) {
        tabPurchases.innerHTML = `
          <div style="text-align:center;padding:48px 0;color:#78716c;">
            <div style="font-size:40px;margin-bottom:12px;">🛍️</div>
            <div style="font-weight:600;font-size:16px;margin-bottom:4px;">No purchases yet</div>
            <div style="font-size:14px;">Your order history will appear here.</div>
          </div>`;
      } else {
        tabPurchases.innerHTML = orders.map(order => {
          const itemsList = (order.order_items || []).map(item => `
            <div style="display:flex;justify-content:space-between;align-items:center;
                        padding:8px 0;border-bottom:1px solid #f5f5f4;font-size:14px;">
              <span style="color:#1c1917;">
                ${sanitize(item.title)}
                ${item.quantity > 1 ? `<span style="color:#78716c;"> × ${item.quantity}</span>` : ''}
              </span>
              <span style="color:#3d5a30;font-weight:600;">
                $${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>`).join('');

          return `
            <div style="background:white;border:1px solid #e7e5e4;border-radius:12px;
                        padding:20px;margin-bottom:16px;">
              <div style="display:flex;justify-content:space-between;align-items:center;
                          margin-bottom:12px;">
                <div>
                  <div style="font-size:12px;color:#78716c;">Order ID</div>
                  <div style="font-weight:700;font-size:14px;color:#1c1917;font-family:monospace;">
                    #${sanitize(order.id.slice(0, 8).toUpperCase())}
                  </div>
                </div>
                <div style="text-align:right;">
                  ${statusBadge(order.status)}
                  <div style="font-size:12px;color:#78716c;margin-top:4px;">
                    ${formatDate(order.created_at)}
                  </div>
                </div>
              </div>
              ${itemsList}
              <div style="display:flex;justify-content:flex-end;margin-top:12px;
                          font-weight:700;font-size:15px;color:#1c1917;">
                Total: <span style="color:#3d5a30;margin-left:8px;">$${Number(order.total).toFixed(2)}</span>
              </div>
            </div>`;
        }).join('');
      }
    }

    // ==========================================
    // 4. SELLING HISTORY
    // ==========================================
    const { data: sellerProducts, error: sellerError } = await supabase
      .from('products')
      .select(`
        id,
        title,
        price,
        image_url,
        created_at,
        stock,
        order_items (
          id,
          quantity
        )
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (sellerError) console.error('Selling history error:', sellerError);

    // Update badge
    const sellingTabBadge = document.querySelector('button[data-tab="selling"] span');
    if (sellingTabBadge) sellingTabBadge.textContent = sellerProducts ? sellerProducts.length : 0;

    // Render tab
    const tabSelling = document.getElementById("tab-selling");
    if (tabSelling) {
      if (!sellerProducts || sellerProducts.length === 0) {
        tabSelling.innerHTML = `
          <div style="text-align:center;padding:48px 0;color:#78716c;">
            <div style="font-size:40px;margin-bottom:12px;">🏷️</div>
            <div style="font-weight:600;font-size:16px;margin-bottom:4px;">No listings yet</div>
            <div style="font-size:14px;">Items you sell will appear here.</div>
          </div>`;
      } else {
        tabSelling.innerHTML = `
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">
            ${sellerProducts.map(p => {
              const totalSold = (p.order_items || []).reduce((sum, oi) => sum + (oi.quantity || 0), 0);
              const inStock = p.stock !== null ? p.stock : '—';
              const soldBadge = totalSold > 0
                ? `<span style="background:#dcfce7;color:#166534;padding:2px 8px;
                               border-radius:99px;font-size:11px;font-weight:600;">
                     ${totalSold} sold
                   </span>`
                : `<span style="background:#f5f5f4;color:#78716c;padding:2px 8px;
                               border-radius:99px;font-size:11px;font-weight:600;">
                     Not sold yet
                   </span>`;

              return `
                <div style="background:white;border:1px solid #e7e5e4;border-radius:12px;
                            overflow:hidden;cursor:pointer;"
                     onclick="window.location.hash='product-detail?productId=${p.id}'">
                  <div style="position:relative;">
                    <img src="${sanitize(p.image_url || '')}"
                         style="width:100%;aspect-ratio:4/3;object-fit:cover;"
                         onerror="this.style.background='#f5f5f4';this.removeAttribute('src')">
                    <div style="position:absolute;top:8px;right:8px;">${soldBadge}</div>
                  </div>
                  <div style="padding:12px;">
                    <div style="font-weight:700;color:#1c1917;font-size:14px;
                                white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                      ${sanitize(p.title)}
                    </div>
                    <div style="display:flex;justify-content:space-between;
                                align-items:center;margin-top:8px;">
                      <span style="color:#3d5a30;font-weight:600;font-size:14px;">
                        $${Number(p.price).toFixed(2)}
                      </span>
                      <span style="color:#78716c;font-size:12px;">
                        Stock: ${inStock}
                      </span>
                    </div>
                    <div style="color:#a8a29e;font-size:11px;margin-top:4px;">
                      Listed ${formatDate(p.created_at)}
                    </div>
                  </div>
                </div>`;
            }).join('')}
          </div>`;
      }
    }

    // ==========================================
    // 5. SAVED ITEMS
    // ==========================================
    const { data: favorites, error: favError } = await supabase
      .from('favorites')
      .select('product_id, products(*)')
      .eq('user_id', user.id);

    if (favError) console.error('Saved items error:', favError);

    const favCount = favorites ? favorites.length : 0;

    const savedTabBadge = document.querySelector('button[data-tab="saved"] span');
    if (savedTabBadge) savedTabBadge.textContent = favCount;

    const tabSaved = document.getElementById("tab-saved");
    if (tabSaved) {
      if (favCount === 0) {
        tabSaved.innerHTML = `
          <div style="text-align:center;padding:48px 0;color:#78716c;">
            <div style="font-size:40px;margin-bottom:12px;">🤍</div>
            <div style="font-weight:600;font-size:16px;margin-bottom:4px;">No saved items</div>
            <div style="font-size:14px;">Items you heart will appear here.</div>
          </div>`;
      } else {
        tabSaved.innerHTML =
          `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:20px;">` +
          favorites.map(f => {
            const p = f.products;
            if (!p) return '';
            return `
              <div style="background:white;border-radius:12px;border:1px solid #e7e5e4;
                          padding:16px;cursor:pointer;"
                   onclick="window.location.hash='product-detail?productId=${p.id}'">
                <img src="${sanitize(p.image_url || '')}"
                     style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;margin-bottom:12px;"
                     onerror="this.style.background='#f5f5f4';this.removeAttribute('src')">
                <div style="font-weight:700;color:#1c1917;font-size:14px;">${sanitize(p.title)}</div>
                <div style="color:#3d5a30;font-weight:600;font-size:14px;margin-top:4px;">
                  $${Number(p.price).toFixed(2)}
                </div>
              </div>`;
          }).join('') +
          `</div>`;
      }
    }

    // ==========================================
    // 6. EDIT PROFILE
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
          renderProfile();
        }
      });
    }

    // ==========================================
    // 7. NAVIGASI TOMBOL HEADER
    // ==========================================
    const btnNavs = document.querySelectorAll('button[data-route]');
    btnNavs.forEach(btn => {
      btn.addEventListener('click', () => {
        const route = btn.getAttribute('data-route');
        if (route) navigate(route);
      });
    });

    // ==========================================
    // 8. LOGIKA TAB
    // ==========================================
    const tabs     = document.querySelectorAll('.profile-tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', e => {
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

        const contentEl = document.getElementById(`tab-${targetTab.getAttribute('data-tab')}`);
        if (contentEl) contentEl.style.display = 'block';
      });
    });

    // ==========================================
    // 9. PREFERENCES — dari user_settings (BUKAN profiles)
    // ==========================================
    let { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Buat row user_settings kalau belum ada
    if (!settings) {
      const { data: newSettings } = await supabase
        .from('user_settings')
        .insert([{ user_id: user.id }])
        .select()
        .single();
      settings = newSettings || {};
    }

    const prefSelects = document.querySelectorAll('#tab-preferences select');
    if (prefSelects.length > 0 && settings) {
      // Asumsi select[0] = currency, select[1] = theme (sesuaikan dengan HTML kamu)
      if (settings.currency) prefSelects[0].value = settings.currency;
      if (prefSelects[1] && settings.theme) prefSelects[1].value = settings.theme;

      prefSelects[0].addEventListener('change', async e => {
        await supabase
          .from('user_settings')
          .update({ currency: e.target.value, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
        showToast("Preferences Saved!");
      });

      if (prefSelects[1]) {
        prefSelects[1].addEventListener('change', async e => {
          await supabase
            .from('user_settings')
            .update({ theme: e.target.value, updated_at: new Date().toISOString() })
            .eq('user_id', user.id);
          showToast("Preferences Saved!");
        });
      }
    }

    // ==========================================
    // 10. LOGOUT
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