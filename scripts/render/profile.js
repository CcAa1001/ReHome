// scripts/render/profile.js
import { getSupabaseClient } from "../supabaseClient.js";
import { navigate } from "../router.js";
import { logoutUser } from "../auth.js";
import { showToast } from "../ui.js";
import { toSafeNumber } from "../security.js";

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

    const displayName = profile.shop_name || profile.full_name || fullName;

    const initialEl    = document.getElementById("profile-initial");
    const avatarImgEl  = document.getElementById("profile-avatar-img");
    const nameDisplay  = document.getElementById("profile-name-display");
    const emailDisplay = document.getElementById("profile-email-display");
    const joinEl       = document.getElementById("profile-join-date");

    if (profile.avatar_url && avatarImgEl) {
      avatarImgEl.innerHTML = `<img src="${sanitize(profile.avatar_url)}" style="width:100%; height:100%; object-fit:cover;">`;
    } else if (initialEl) {
      initialEl.textContent = displayName.charAt(0).toUpperCase();
    }
    
    if (nameDisplay)  nameDisplay.textContent  = displayName;
    if (emailDisplay) emailDisplay.textContent = userEmail;
    if (joinEl)       joinEl.textContent       = `Member since ${joinDate}`;

    const allP = container.querySelectorAll("p");
    const descDisplay = Array.from(allP).find(p => p.textContent.includes("Curator") || p.innerHTML.includes("profile-location"));
    if (descDisplay) {
      descDisplay.innerHTML =
        `${sanitize(profile.description || "Curator & Sustainability Advocate")} &bull; <span id="profile-location">${sanitize(profile.location || "Earth")}</span>`;
    }

    const impactEl = document.getElementById("profile-impact-score");
    if (impactEl) {
      const score = profile.impact_score || 0;
      impactEl.textContent = score.toLocaleString();
      
      const treesEl = document.getElementById("profile-impact-trees");
      if (treesEl) {
        const trees = Math.floor(score / 175);
        treesEl.textContent = `Equivalent to planting ${trees} trees through circular shopping.`;
      }
    }

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
          product_id,
          delivery_status,
          products (image_url, description, category, condition, maker)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersError) console.error('Purchase history error:', ordersError);

    // Render tab
    const tabPurchases = document.getElementById("tab-purchase");
    if (tabPurchases) {
      if (!orders || orders.length === 0) {
        tabPurchases.innerHTML = `
          <div style="text-align:center;padding:48px 0;color:#78716c;">
            <div style="font-size:40px;margin-bottom:12px;">🛍️</div>
            <div style="font-weight:600;font-size:16px;margin-bottom:4px;">No purchases yet</div>
            <div style="font-size:14px;">Your order history will appear here.</div>
          </div>`;
      } else {
        tabPurchases.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">` + 
          orders.flatMap(order => {
            return (order.order_items || [])
              .filter(item => item.delivery_status !== 'resold')
              .map(item => {
              const deliveryStatus = item.delivery_status || 'delivered';
              const isVaulted = deliveryStatus === 'vaulted';
              
              const statusDisplay = deliveryStatus;
              const statusColor = deliveryStatus === 'delivered' ? '#15803d' : deliveryStatus === 'vaulted' ? '#854d0e' : '#1e40af';
              const statusBg = deliveryStatus === 'delivered' ? '#f0faf5' : deliveryStatus === 'vaulted' ? '#fef9c3' : '#dbeafe';
              const imgUrl = item.products?.image_url || '';
              
              let actionsHtml = '';
              if (isVaulted) {
                const productData = {
                   title: item.title,
                   price: item.price,
                   image_url: imgUrl,
                   description: item.products?.description || '',
                   category: item.products?.category || '',
                   condition: item.products?.condition || '',
                   maker: item.products?.maker || '',
                   quantity: item.quantity
                };
                
                actionsHtml = `
                  <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <button class="btn-deliver-vault" data-item-id="${item.id}" style="flex: 1; padding: 8px; background: #3d5a30; color: white; border: none; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer;">Deliver</button>
                    <button class="btn-resell-vault" data-item-id="${item.id}" data-product='${sanitize(JSON.stringify(productData))}' style="flex: 1; padding: 8px; background: white; color: #1c1917; border: 1px solid #d6d3d1; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer;">Resell</button>
                  </div>
                `;
              }
              
              return `
                <div class="purchase-item-card" data-product-id="${item.product_id}" style="background:white;border:1px solid #e7e5e4;border-radius:12px;
                            overflow:hidden;cursor:pointer;">
                  <div style="position:relative;">
                    <img src="${sanitize(imgUrl)}"
                         style="width:100%;aspect-ratio:4/3;object-fit:cover;"
                         onerror="this.style.background='#f5f5f4';this.removeAttribute('src')">
                    <div style="position:absolute;top:8px;right:8px;">
                      <span style="background:${statusBg};color:${statusColor};padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;border:1px solid ${statusBg};text-transform:capitalize;">${sanitize(statusDisplay)}</span>
                    </div>
                  </div>
                  <div style="padding:12px;">
                    <div style="font-weight:700;color:#1c1917;font-size:14px;
                                white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                      ${sanitize(item.title)}
                    </div>
                    <div style="display:flex;justify-content:space-between;
                                align-items:center;margin-top:8px;">
                      <span style="color:#3d5a30;font-weight:600;font-size:14px;">
                        $${Number(item.price).toFixed(2)}
                      </span>
                      <span style="color:#78716c;font-size:12px;">
                        Qty: ${item.quantity}
                      </span>
                    </div>
                    <div style="color:#a8a29e;font-size:11px;margin-top:4px;">
                      Order #${sanitize(order.id.slice(0, 8).toUpperCase())} &bull; ${formatDate(order.created_at)}
                    </div>
                    ${actionsHtml}
                  </div>
                </div>`;
            });
          }).join('') + `</div>`;
      }
    }

    const { data: sellerProducts, error: sellerError } = await supabase
      .from('products')
      .select(`
        id,
        title,
        price,
        image_url,
        created_at,
        stock,
        status,
        order_items (
          id,
          quantity
        )
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (sellerError) console.error('Selling history error:', sellerError);

    const activeListings = (sellerProducts || []).filter(p => p.status !== 'draft');
    const draftListings = (sellerProducts || []).filter(p => p.status === 'draft');

    // Render Selling tab
    const tabSelling = document.getElementById("tab-selling");
    if (tabSelling) {
      if (activeListings.length === 0) {
        tabSelling.innerHTML = `
          <div style="text-align:center;padding:48px 0;color:#78716c;">
            <div style="font-size:40px;margin-bottom:12px;">🏷️</div>
            <div style="font-weight:600;font-size:16px;margin-bottom:4px;">No listings yet</div>
            <div style="font-size:14px;">Items you sell will appear here.</div>
          </div>`;
      } else {
        tabSelling.innerHTML = `
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">
            ${activeListings.map(p => {
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
                <div class="selling-item-card" data-product-id="${p.id}" style="background:white;border:1px solid #e7e5e4;border-radius:12px;
                            overflow:hidden;cursor:pointer;">
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

    // Render My Offers
    const { data: myOffers, error: myOffersErr } = await supabase
      .from('offers')
      .select('*, products(title, price, image_url)')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });

    const offersList = document.getElementById("profile-offers-list");
    if (offersList) {
      if (myOffersErr) {
        console.error("Error fetching my offers", myOffersErr);
      } else if (!myOffers || myOffers.length === 0) {
        offersList.innerHTML = `
          <div style="text-align:center;padding:48px 0;color:#78716c;background:white;border-radius:12px;border:1px solid #e7e5e4;">
            <div style="font-size:40px;margin-bottom:12px;">💬</div>
            <div style="font-weight:600;font-size:16px;margin-bottom:4px;">No offers made</div>
            <div style="font-size:14px;">Offers you send to sellers will appear here.</div>
          </div>
        `;
      } else {
        offersList.innerHTML = myOffers.map(offer => {
          const productTitle = offer.products?.title || 'Unknown Item';
          const productPrice = Number(offer.products?.price || 0);
          const offerPrice = Number(offer.amount || 0);
          const imgUrl = offer.products?.image_url || '';
          
          const statusMap = {
            pending: { bg: '#fef9c3', color: '#854d0e', label: 'Pending' },
            accepted: { bg: '#dcfce7', color: '#166534', label: 'Accepted (Added to Cart)' },
            rejected: { bg: '#fecaca', color: '#991b1b', label: 'Rejected' },
          };
          const st = statusMap[offer.status] || statusMap.pending;

          return `
            <div style="background:white;border:1px solid #e7e5e4;border-radius:12px;padding:20px;display:flex;align-items:center;gap:20px;">
              <img src="${sanitize(imgUrl)}" style="width:64px;height:64px;border-radius:8px;object-fit:cover;" onerror="this.style.display='none'">
              <div style="flex:1;">
                <h4 style="margin:0 0 4px;font-size:15px;color:#1c1917;">${sanitize(productTitle)}</h4>
                <div style="font-size:14px;color:#78716c;margin-bottom:8px;">You offered: <strong style="color:#3d5a30;">$${offerPrice.toLocaleString()}</strong> (Listed: $${productPrice.toLocaleString()})</div>
                <div style="font-size:12px;color:#a8a29e;">Sent on ${formatDate(offer.created_at)}</div>
              </div>
              <div>
                <span style="background:${st.bg};color:${st.color};padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;">${st.label}</span>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Render Drafts tab
    const draftsGrid = document.getElementById("profile-drafts-grid");
    if (draftsGrid) {
      if (draftListings.length === 0) {
        draftsGrid.parentElement.innerHTML = `
          <div style="text-align:center;padding:48px 0;color:#78716c;background:white;border-radius:12px;border:1px solid #e7e5e4;">
            <div style="font-size:40px;margin-bottom:12px;">📝</div>
            <div style="font-weight:600;font-size:16px;margin-bottom:4px;">No drafts</div>
            <div style="font-size:14px;">Items you save as draft will appear here.</div>
          </div>`;
      } else {
        draftsGrid.innerHTML = draftListings.map(p => `
          <div style="background:white;border-radius:14px;border:1px dashed #c8c6c0;overflow:hidden;opacity:0.8;transition:0.2s;cursor:pointer;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">
            <div style="aspect-ratio:4/3;background:#f5f5f4;position:relative;">
              ${p.image_url ? `<img src="${p.image_url}" style="width:100%;height:100%;object-fit:cover;">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#a8a29e;">No Image</div>`}
              <div style="position:absolute;top:10px;right:10px;background:white;font-size:11px;font-weight:700;padding:4px 8px;border-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">DRAFT</div>
            </div>
            <div style="padding:16px;">
              <h4 style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1c1917;">${sanitize(p.title || 'Untitled Draft')}</h4>
              <p style="margin:0;font-size:14px;color:#78716c;">$${toSafeNumber(p.price).toLocaleString()}</p>
            </div>
          </div>
        `).join('');
      }
    }

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
              <div class="saved-item-card" data-product-id="${p.id}" style="background:white;border-radius:12px;border:1px solid #e7e5e4;
                          padding:16px;cursor:pointer;">
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

    const editBtn = Array.from(container.querySelectorAll("button"))
      .find(b => b.textContent.trim().includes("Edit Profile"));

    if (editBtn) {
      editBtn.addEventListener("click", () => {
        navigate("edit-profile");
      });
    }

    const btnNavs = document.querySelectorAll('button[data-route]');
    btnNavs.forEach(btn => {
      btn.addEventListener('click', () => {
        const route = btn.getAttribute('data-route');
        if (route) navigate(route);
      });
    });

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

    const setupCardNav = async (selector) => {
      document.querySelectorAll(selector).forEach(card => {
        card.addEventListener('click', async (e) => {
          if (e.target.tagName === 'BUTTON') return;
          const { setRouteParams, navigate } = await import('../router.js');
          setRouteParams({ productId: card.dataset.productId });
          navigate('product-detail');
        });
      });
    };
    setupCardNav('.purchase-item-card');
    setupCardNav('.selling-item-card');
    setupCardNav('.saved-item-card');

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

    document.querySelectorAll('.btn-deliver-vault').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        btn.disabled = true;
        btn.textContent = 'Processing...';
        const itemId = btn.dataset.itemId;
        try {
          const { error } = await supabase.from('order_items').update({ delivery_status: 'delivered' }).eq('id', itemId);
          if (error) throw error;
          showToast("Delivery requested! The item is on its way.");
          renderProfile(); // re-render to update UI
        } catch (err) {
          showToast("Failed to request delivery.");
          btn.disabled = false;
          btn.textContent = 'Deliver';
        }
      });
    });

    document.querySelectorAll('.btn-resell-vault').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const itemId = btn.dataset.itemId;
        const productData = JSON.parse(btn.dataset.product || '{}');
        
        // Store product data in localStorage for new-listing to pick up
        localStorage.setItem('rehome_resell_data', JSON.stringify({ ...productData, order_item_id: itemId }));
        
        showToast("Setting up your resell listing...");
        navigate("new-listing");
      });
    });

  } catch (err) {
    console.error("Gagal memuat profil:", err);
    container.innerHTML = `<div style="padding:100px;text-align:center;"><h2>Gagal memuat profil.</h2><p>${sanitize(err.message)}</p></div>`;
  }
}