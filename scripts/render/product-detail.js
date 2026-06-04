// scripts/render/product-detail.js
import { getRouteParams, navigate } from "../router.js";
import { getSupabaseClient } from "../supabaseClient.js";
import { showToast } from "../ui.js";

let currentLightboxIndex = 0;
let productImages = [];

export async function renderProductDetail() {
  const container = document.getElementById("router-view");
  if (!container) return;

  const { productId } = getRouteParams();
  if (!productId) { navigate("shop"); return; }

  try {
    const supabase = await getSupabaseClient();
    const { data: product, error } = await supabase.from('products').select('*').eq('id', productId).single();
    if (error || !product) throw new Error("Item tidak ditemukan.");

    productImages = [product.image_url, product.image_url, product.image_url];
    
    const mainImg = container.querySelector(".pd-main-img") || container.querySelector("img");
    if (mainImg) {
      mainImg.src = productImages[0]; 
      mainImg.style.cursor = "zoom-in";
      mainImg.addEventListener("click", () => openLightbox(0));
    }

    const thumbsEl = container.querySelector(".pd-thumbs");
    if (thumbsEl) {
      thumbsEl.innerHTML = productImages.map((src, idx) => 
        `<img class="thumb-img ${idx===0 ? 'active':''}" src="${src}" style="width:70px;height:70px;object-fit:cover;border-radius:8px;cursor:pointer;border:2px solid transparent; transition: 0.2s;">`
      ).join("");
      
      thumbsEl.querySelectorAll("img").forEach((t, i) => {
        t.addEventListener("click", () => {
          mainImg.src = productImages[i];
          thumbsEl.querySelectorAll("img").forEach(x => x.style.borderColor = "transparent");
          t.style.borderColor = "#3d5a30";
        });
      });
    }

    const crumb = container.querySelector(".pd-breadcrumbs");
    if (crumb) {
      crumb.innerHTML = `<span data-nav="shop" style="cursor:pointer;color:#78716c;">Shop</span> / <span data-nav="cat" style="cursor:pointer;color:#78716c;">${product.category ?? "Furniture"}</span> / <span style="color:#1c1917;font-weight:bold;">${product.title}</span>`;
      crumb.querySelectorAll("span[data-nav]").forEach(el => el.addEventListener("click", () => navigate("shop")));
    }

    if (container.querySelector(".pd-title")) container.querySelector(".pd-title").textContent = product.title;
    if (container.querySelector(".pd-price")) container.querySelector(".pd-price").textContent = `$${product.price}`;
    if (container.querySelector(".pd-desc")) container.querySelector(".pd-desc").textContent = product.description;
    
    const condEl = container.querySelector(".pd-condition");
    const stockTersedia = product.stock !== undefined ? product.stock : 1;
    if (condEl) condEl.innerHTML = `<span>Condition</span><strong>${product.condition}</strong><em>${stockTersedia} in stock (Pre-loved)</em>`;

    // --- ADD TO CART ANIMATION, UI & DB SYNC ---
    const btnCart = container.querySelector("[data-add-cart]");
    if (btnCart) {
      const wrapper = btnCart.closest("a") || btnCart.closest("[data-route]") || btnCart;
      
      const newBtn = document.createElement("button");
      newBtn.style.cssText = `
        width: 100%; padding: 16px; background-color: #3d5a30; color: white; border: none;
        border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer;
        transition: background-color 0.2s ease, transform 0.1s ease; display: flex;
        justify-content: center; align-items: center; gap: 10px; margin-top: 20px;
      `;
      newBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        <span>Add to Cart</span>
      `;
      
      newBtn.addEventListener("mouseover", () => newBtn.style.backgroundColor = "#2b4022");
      newBtn.addEventListener("mouseout", () => newBtn.style.backgroundColor = "#3d5a30");
      newBtn.addEventListener("mousedown", () => newBtn.style.transform = "scale(0.98)");
      newBtn.addEventListener("mouseup", () => newBtn.style.transform = "scale(1)");

      wrapper.parentNode.replaceChild(newBtn, wrapper);
      
      newBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        newBtn.disabled = true;
        newBtn.style.opacity = "0.7";
        const originalText = newBtn.innerHTML;
        newBtn.querySelector("span").textContent = "Checking stock...";
        
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
               alert("Silakan login terlebih dahulu.");
               return; 
            }

            // PERBAIKAN: Gunakan .select() biasa agar tidak error saat keranjang kosong/ganda
            const { data: existingCarts, error: fetchError } = await supabase
               .from('cart_items')
               .select('id, quantity')
               .eq('user_id', session.user.id)
               .eq('product_id', product.id);

            if (fetchError) throw fetchError;

            // Jika ada, jumlahkan total barang yang sama di keranjang
            let currentQtyInCart = 0;
            if (existingCarts && existingCarts.length > 0) {
               currentQtyInCart = existingCarts.reduce((sum, item) => sum + item.quantity, 0);
            }

            const maxStock = product.stock !== undefined ? product.stock : 1;

            // BLOKIR JIKA STOK MENTOK
            if (currentQtyInCart >= maxStock) {
               showToast(`Gagal! Stok hanya tersisa ${maxStock} item.`);
               return; // Berhenti, jangan mainkan animasi terbang
            }
            
            newBtn.querySelector("span").textContent = "Syncing...";
            flyToCart(e.clientX, e.clientY, product.image_url);

            if (existingCarts && existingCarts.length > 0) {
               // Update baris keranjang yang sudah ada
               const targetId = existingCarts[0].id;
               const newQty = existingCarts[0].quantity + 1;
               const { error: updateError } = await supabase.from('cart_items').update({ quantity: newQty }).eq('id', targetId);
               if (updateError) throw updateError;
            } else {
               // Masukkan baris baru ke keranjang
               const { error: insertError } = await supabase.from('cart_items').insert({ user_id: session.user.id, product_id: product.id, quantity: 1 });
               if (insertError) throw insertError;
            }
               
            showToast(`${product.title} added to your cart.`);
            if (window.updateGlobalCartBadge) await window.updateGlobalCartBadge();

        } catch (err) {
            console.error("Cart sync error", err);
            showToast("Gagal menyimpan ke database.");
        } finally {
            // Selalu kembalikan tombol ke bentuk semula, berhasil atau gagal
            newBtn.innerHTML = originalText;
            newBtn.disabled = false;
            newBtn.style.opacity = "1";
        }
      });
    }

  } catch (err) {
    console.warn("Gagal render produk:", err);
    container.innerHTML = `<div style="padding:100px; text-align:center;"><h2>Produk gagal dimuat.</h2></div>`;
  }
}

// --- HELPER FUNCTIONS ---
function openLightbox(index) {
  let overlay = document.querySelector(".lightbox-overlay");
  if (!overlay) {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="lightbox-overlay">
        <button class="lightbox-prev">❮</button>
        <img class="lightbox-img" src="">
        <button class="lightbox-next">❯</button>
      </div>
    `);
    overlay = document.querySelector(".lightbox-overlay");
    overlay.addEventListener("click", (e) => {
      if (e.target.classList.contains("lightbox-overlay")) overlay.classList.remove("active");
    });
    overlay.querySelector(".lightbox-prev").addEventListener("click", () => changeLightbox(-1));
    overlay.querySelector(".lightbox-next").addEventListener("click", () => changeLightbox(1));
  }
  currentLightboxIndex = index;
  overlay.querySelector(".lightbox-img").src = productImages[currentLightboxIndex];
  overlay.classList.add("active");
}

function changeLightbox(dir) {
  currentLightboxIndex += dir;
  if (currentLightboxIndex < 0) currentLightboxIndex = productImages.length - 1;
  if (currentLightboxIndex >= productImages.length) currentLightboxIndex = 0;
  document.querySelector(".lightbox-img").src = productImages[currentLightboxIndex];
}

function flyToCart(startX, startY, imageUrl) {
  const cartIcon = document.querySelector('nav [data-route="cart"], header [data-route="cart"], .app-nav [data-route="cart"]');
  if (!cartIcon) return;
  
  const targetRect = cartIcon.getBoundingClientRect();
  
  const flyer = document.createElement("div");
  flyer.style.position = "fixed";
  flyer.style.width = "60px";
  flyer.style.height = "60px";
  flyer.style.borderRadius = "50%";
  flyer.style.backgroundColor = "#3d5a30";
  if (imageUrl) {
     flyer.style.backgroundImage = `url('${imageUrl}')`;
     flyer.style.backgroundSize = "cover";
     flyer.style.backgroundPosition = "center";
  }
  flyer.style.left = (startX - 30) + "px";
  flyer.style.top = (startY - 30) + "px";
  flyer.style.zIndex = "999999";
  flyer.style.boxShadow = "0 10px 20px rgba(0,0,0,0.3)";
  flyer.style.transition = "all 0.8s cubic-bezier(0.25, 1, 0.5, 1)";
  flyer.style.pointerEvents = "none";
  document.body.appendChild(flyer);

  if (!document.getElementById("cart-shake-style")) {
    const style = document.createElement("style");
    style.id = "cart-shake-style";
    style.innerHTML = `
      @keyframes cartPopShake {
        0% { transform: scale(1) rotate(0deg); }
        25% { transform: scale(1.3) rotate(-15deg); }
        50% { transform: scale(1.3) rotate(15deg); }
        75% { transform: scale(1.3) rotate(-15deg); }
        100% { transform: scale(1) rotate(0deg); }
      }
      .cart-anim-pop { animation: cartPopShake 0.5s ease-in-out; }
    `;
    document.head.appendChild(style);
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      flyer.style.left = (targetRect.left + (targetRect.width / 2) - 10) + "px";
      flyer.style.top = (targetRect.top + (targetRect.height / 2) - 10) + "px";
      flyer.style.width = "20px";
      flyer.style.height = "20px";
      flyer.style.opacity = "0.3";
    });
  });

  setTimeout(() => {
    flyer.remove();
    
    cartIcon.classList.add("cart-anim-pop");
    setTimeout(() => cartIcon.classList.remove("cart-anim-pop"), 500);
    
    let badge = cartIcon.querySelector(".cart-badge") || cartIcon.querySelector("span");
    if (badge) {
       let num = parseInt(badge.textContent) || 0;
       badge.textContent = num + 1;
       badge.style.transform = "scale(1.5)";
       badge.style.transition = "transform 0.3s";
       setTimeout(() => badge.style.transform = "scale(1)", 300);
    }
  }, 800);
}