import { getRouteParams, navigate } from "../router.js";
import { getSupabaseClient } from "../supabaseClient.js";
import { clampInteger, isUuid, sanitize, sanitizeShortText, sanitizeUrl, toSafeMoney } from "../security.js";
import { showToast } from "../ui.js";

let productImages = [];
let favoriteIds = JSON.parse(localStorage.getItem("rehome_favorites") || "[]");

export async function renderProductDetail() {
  const container = document.getElementById("router-view");
  if (!container) return;

  const { productId } = getRouteParams();
  if (!productId) { navigate("shop"); return; }
  if (!isUuid(productId)) { navigate("shop"); return; }

  try {
    const supabase = await getSupabaseClient();
    const { data: product, error } = await supabase.from('products').select(`
      *,
      profiles:seller_id (shop_name, full_name, avatar_url)
    `).eq('id', productId).single();
    if (error || !product) throw new Error("Item tidak ditemukan.");

    const seller = product.profiles || {};
    const safeMaker = sanitizeShortText(seller.shop_name || seller.full_name || product.maker || 'Elena Studio');
    const safeSellerAvatar = sanitizeUrl(seller.avatar_url || 'assets/elena.png');

    const mainImageUrl = sanitizeUrl(product.image_url);
    const dbImageUrls = Array.isArray(product.image_urls) && product.image_urls.length > 0 
      ? product.image_urls.map(u => sanitizeUrl(u)) 
      : [mainImageUrl, mainImageUrl, mainImageUrl];
    
    productImages = dbImageUrls;
    
    const safeTitle = sanitizeShortText(product.title, "Untitled item");
    const safeCategory = sanitizeShortText(product.category || "Living Room");
    const safeCondition = sanitizeShortText(product.condition || "Excellent");
    const safeDescription = sanitize(product.description || 'A masterpiece of influence, this item features solid craftsmanship. The material is a sustainable blend offering both durability and a soft tactile experience.');
    const safePrice = toSafeMoney(product.price);

    const stockTersedia = clampInteger(product.stock ?? 1, 1, 999, 1);
    const isActiveClass = favoriteIds.includes(product.id) ? "active" : "";

    container.innerHTML = `
      <div style="max-width: 1200px; margin: 0 auto; padding: 40px 20px; font-family: var(--sans);">
        
        <div style="margin-bottom: 24px; font-size: 13px; color: #78716c;">
          <button type="button" id="product-back-shop" style="cursor:pointer; border:0; background:transparent; color:inherit; padding:0; font:inherit;">Shop</button> / 
          <span>${safeCategory}</span> / 
          <span style="color:#1c1917; font-weight:600;">${safeTitle}</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 60px;">
          
          <div>
            <div style="position: relative; width: 100%; aspect-ratio: 4/5; background: #f5f5f4; border-radius: 16px; overflow: hidden;">
              <button class="btn-favorite ${isActiveClass}" style="width: 44px; height: 44px; top: 16px; right: 16px; position: absolute; z-index: 10;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              </button>
              <img src="${productImages[0]}" alt="${safeTitle}" style="width: 100%; height: 100%; object-fit: cover;" id="main-image">
              <div style="position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; background: rgba(0,0,0,0.3); padding: 6px 12px; border-radius: 99px;">
                <div style="width: 6px; height: 6px; border-radius: 50%; background: white;"></div>
                <div style="width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.5);"></div>
                <div style="width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.5);"></div>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 16px;" id="thumb-gallery"></div>
          </div>

          <div style="padding-top: 10px;">
            <div class="pd-tag-pill" style="margin-bottom: 16px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#3d5a30"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
              Sustainably Sourced
            </div>
            
            <h1 style="font-family: var(--serif); font-size: 42px; color: #1c1917; margin: 0 0 16px 0; line-height: 1.1;">${safeTitle}</h1>
            <div style="font-size: 28px; color: #78716c; font-weight: 500; margin-bottom: 32px;">$${safePrice}</div>
            
            <div style="margin-bottom: 24px;">
              <span style="font-size: 13px; color: #78716c; display: block; margin-bottom: 8px;">Condition</span>
              <div style="display: flex; gap: 12px;">
                <div class="pd-condition-pill" style="background: #fbfaf9; border-color: #3d5a30; color: #3d5a30;">${safeCondition} (Pre-owned)</div>
                <div class="pd-condition-pill">Refurbished</div>
              </div>
            </div>

            <p style="color: #57534e; line-height: 1.6; margin-bottom: 32px; font-size: 15px;">
              ${safeDescription}
            </p>

            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
              <div class="qty-selector">
                <button class="qty-btn" id="btn-min">−</button>
                <input type="text" class="qty-input" id="qty-val" value="1" readonly>
                <button class="qty-btn" id="btn-plus">+</button>
              </div>
              <span style="color: #c2410c; font-size: 13px; font-weight: 500;">Only ${stockTersedia} in stock</span>
            </div>

            <button id="add-to-cart-btn" style="width: 100%; padding: 16px; background-color: #556b45; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; transition: 0.2s; display: flex; justify-content: center; align-items: center; gap: 10px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              <span>Add to Cart</span>
            </button>
            
            <button class="btn-outline">Make an Offer</button>

            <div class="seller-box">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 48px; height: 48px; background: #e7e5e4; border-radius: 50%; overflow: hidden;">
                  <img src="${safeSellerAvatar}" alt="${safeMaker}" style="width:100%; height:100%; object-fit:cover;">
                </div>
                <div>
                  <div style="font-weight: 600; font-size: 15px; color: #1c1917;">${safeMaker}</div>
                  <div style="font-size: 12px; color: #78716c; margin-top: 2px;">★ 4.9 (124 reviews)</div>
                </div>
              </div>
              <span style="font-size: 13px; font-weight: 600; color: #78716c; cursor: pointer;">View Shop</span>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("product-back-shop")?.addEventListener("click", () => navigate("shop"));

    const thumbGallery = document.getElementById("thumb-gallery");
    if (thumbGallery) {
      thumbGallery.innerHTML = productImages.slice(0, 4).map((src, i) => {
        const isLast = i === 3 && productImages.length > 4;
        return `
          <div style="position: relative; aspect-ratio: 1; border-radius: 12px; overflow: hidden; cursor: pointer; border: 2px solid ${i===0 ? '#3d5a30' : 'transparent'};">
            <img src="${src}" style="width: 100%; height: 100%; object-fit: cover;">
            ${isLast ? `<div style="position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 14px;">+${productImages.length - 3} View</div>` : ''}
          </div>
        `;
      }).join('');
    }

    const favBtn = container.querySelector(".btn-favorite");
    favBtn.addEventListener("click", () => {
      favBtn.classList.toggle("active");
      const isActive = favBtn.classList.contains("active");
      
      if (isActive) {
        if (!favoriteIds.includes(product.id)) favoriteIds.push(product.id);
        showToast("Added to favorites!");
      } else {
        favoriteIds = favoriteIds.filter(id => id !== product.id);
        showToast("Removed from favorites.");
      }
      localStorage.setItem("rehome_favorites", JSON.stringify(favoriteIds));
    });

    const btnMin = document.getElementById("btn-min");
    const btnPlus = document.getElementById("btn-plus");
    const qtyInput = document.getElementById("qty-val");
    let currentQty = 1;

    btnMin.addEventListener("click", () => { if (currentQty > 1) { currentQty--; qtyInput.value = currentQty; } });
    btnPlus.addEventListener("click", () => {
      if (currentQty < stockTersedia) { currentQty++; qtyInput.value = currentQty; }
      else { showToast(`Hanya tersisa ${stockTersedia} stok!`); }
    });

    const btnCart = document.getElementById("add-to-cart-btn");
    btnCart.addEventListener("click", async (e) => {
      e.preventDefault(); e.stopPropagation();
      const requestedQty = clampInteger(qtyInput.value, 1, stockTersedia, 1);
      btnCart.disabled = true; btnCart.style.opacity = "0.7";
      const originalText = btnCart.innerHTML;
      btnCart.querySelector("span").textContent = "Checking...";
      
      try {
          const { data: { user }, error: authErr } = await supabase.auth.getUser();
          if (authErr || !user) { alert("Sesi login belum aktif. Silakan Login."); return; }

          const { data: existingCarts } = await supabase.from('cart_items').select('id, quantity').eq('user_id', user.id).eq('product_id', product.id);
          let qtyInDb = existingCarts && existingCarts.length > 0 ? existingCarts.reduce((sum, item) => sum + item.quantity, 0) : 0;

          if (qtyInDb + requestedQty > stockTersedia) { showToast(`Gagal! Sisa kuota beli untuk item ini: ${stockTersedia - qtyInDb}`); return; }
          
          btnCart.querySelector("span").textContent = "Syncing...";
          flyToCart(e.clientX, e.clientY, safeImageUrl);

          if (existingCarts && existingCarts.length > 0) {
             await supabase.from('cart_items').update({ quantity: existingCarts[0].quantity + requestedQty }).eq('id', existingCarts[0].id);
          } else {
             await supabase.from('cart_items').insert({ user_id: user.id, product_id: product.id, quantity: requestedQty });
          }
             
          showToast(`Added ${requestedQty}x ${safeTitle} to cart.`);
          if (window.updateGlobalCartBadge) await window.updateGlobalCartBadge();

      } catch (err) { console.error(err); showToast("Gagal menyimpan ke database.");
      } finally { btnCart.innerHTML = originalText; btnCart.disabled = false; btnCart.style.opacity = "1"; }
    });

  } catch (err) {
    console.warn("Gagal render produk:", err);
    container.innerHTML = `<div style="padding:100px; text-align:center;"><h2>Produk gagal dimuat.</h2></div>`;
  }
}

function flyToCart(startX, startY, imageUrl) {
  const cartIcon = document.querySelector('nav [data-route="cart"], header [data-route="cart"], .app-nav [data-route="cart"]');
  if (!cartIcon) return;
  const targetRect = cartIcon.getBoundingClientRect();
  const flyer = document.createElement("div");
  flyer.style.cssText = `position:fixed; width:60px; height:60px; border-radius:50%; background:#3d5a30; left:${startX-30}px; top:${startY-30}px; z-index:999999; box-shadow:0 10px 20px rgba(0,0,0,0.3); transition:all 0.8s cubic-bezier(0.25, 1, 0.5, 1); pointer-events:none;`;
  if (imageUrl) { flyer.style.backgroundImage = `url('${imageUrl}')`; flyer.style.backgroundSize = "cover"; flyer.style.backgroundPosition = "center"; }
  document.body.appendChild(flyer);

  if (!document.getElementById("cart-shake-style")) {
    document.head.insertAdjacentHTML("beforeend", `<style id="cart-shake-style">@keyframes cartPopShake { 0% { transform: scale(1) rotate(0deg); } 25% { transform: scale(1.3) rotate(-15deg); } 50% { transform: scale(1.3) rotate(15deg); } 75% { transform: scale(1.3) rotate(-15deg); } 100% { transform: scale(1) rotate(0deg); } } .cart-anim-pop { animation: cartPopShake 0.5s ease-in-out; }</style>`);
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      flyer.style.left = (targetRect.left + (targetRect.width/2) - 10) + "px"; flyer.style.top = (targetRect.top + (targetRect.height/2) - 10) + "px"; flyer.style.width = "20px"; flyer.style.height = "20px"; flyer.style.opacity = "0.3";
    });
  });

  setTimeout(() => {
    flyer.remove();
    cartIcon.classList.add("cart-anim-pop");
    setTimeout(() => cartIcon.classList.remove("cart-anim-pop"), 500);
  }, 800);
}
