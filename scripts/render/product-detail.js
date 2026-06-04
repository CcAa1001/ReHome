// scripts/render/product-detail.js
import { getRouteParams, navigate } from "../router.js";
import { getProducts, addRemoteCartItem } from "../supabaseDatabase.js";
import { addCartItem } from "../storage.js";
import { showToast } from "../ui.js";
import state from "../state.js";

export async function renderProductDetail() {
  const container = document.getElementById("router-view");
  if (!container) return;

  try {
    const { productId } = getRouteParams();
    const products = await getProducts();
    // Jika tidak ada ID produk yang di-klik, tampilkan produk pertama
    const product = products.find(p => p.id === productId) || products[0];

    if (!product) return;

    // 1. Ganti Data secara perlahan (Tanpa Merusak HTML)
    const mainImg = container.querySelector(".main-product-image");
    const titleText = container.querySelector(".product-title");
    const priceText = container.querySelector(".detail-price");
    const crumbTitle = container.querySelector(".crumb-title");
    const conditionText = container.querySelector(".product-condition");
    const makerText = container.querySelector(".product-maker");

    if (mainImg) mainImg.src = product.image;
    if (titleText) titleText.textContent = product.title;
    if (priceText) priceText.textContent = product.price;
    if (crumbTitle) crumbTitle.textContent = product.title;
    if (conditionText) conditionText.textContent = product.condition || "Excellent (Pre-owned)";
    if (makerText) makerText.textContent = product.maker || "Elena Studio";

    // 2. Logic Efek Klik Thumbnail Gambar
    const thumbs = container.querySelectorAll(".thumb-row img");
    if (thumbs.length > 0 && mainImg) {
      thumbs[0].src = product.image; // Paksa thumbnail pertama pakai gambar asli
      thumbs.forEach(thumb => {
        thumb.addEventListener("click", () => {
          mainImg.src = thumb.src;
          thumbs.forEach(t => t.style.opacity = "0.6");
          thumb.style.opacity = "1";
        });
      });
    }

    // 3. Logic Tombol "Add to Cart"
    const btnCart = container.querySelector("[data-add-cart]");
    if (btnCart) {
      // Bersihkan tombol dari event lama agar tidak dobel
      const newBtn = btnCart.cloneNode(true);
      btnCart.parentNode.replaceChild(newBtn, btnCart);
      
      newBtn.addEventListener("click", async () => {
        const remoteAdded = await addRemoteCartItem(product);
        if (!remoteAdded) addCartItem(product);
        
        state.publish("cartUpdated", product);
        showToast(`${product.title} added to your selection.`);
        navigate("cart");
      });
    }
  } catch (err) {
    console.warn("Gagal memuat detail produk:", err);
  }
}