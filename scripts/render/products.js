// scripts/render/products.js
import { navigate } from "../router.js";
import { getProducts } from "../supabaseDatabase.js";

// Wajib ada agar app.js tidak error
export function setCategoryFilter(category) {
  // Kosongkan saja karena filter sekarang dihandle manual di HTML
}

export async function renderProducts() {
  // Hanya menargetkan tempat menaruh kartu, BUKAN seluruh shop!
  const shopContainer = document.querySelector("[data-catalog-products]");
  if (!shopContainer) return;

  try {
    const products = await getProducts();
    
    // Bersihkan isi grid lama
    shopContainer.innerHTML = "";
    
    // Cetak kartu produk saja ke dalam grid
    products.forEach(p => {
      const card = document.createElement("div");
      card.className = "catalog-card";
      card.innerHTML = `
        <img src="${p.image}" alt="${p.title}">
        <div>
          <span>${p.maker || "Independent Studio"}</span>
          <strong>${p.price}</strong>
          <h3>${p.title}</h3>
        </div>
      `;
      // Arahkan ke product-detail saat diklik
      card.addEventListener("click", () => navigate("product-detail", { productId: p.id }));
      shopContainer.appendChild(card);
    });

  } catch (error) {
    console.warn("Products failed to load:", error);
  }
}