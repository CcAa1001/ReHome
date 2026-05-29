// scripts/render/home.js
import { getProducts } from "../supabaseDatabase.js";
import { navigate } from "../router.js";

export async function renderHome() {
  // Hanya menargetkan kotak grid-nya saja, jangan timpa seluruh halaman!
  const grid = document.querySelector("#home-product-grid");
  if (!grid) return;

  try {
    const products = await getProducts();
    // Cetak kartu produk saja
    grid.innerHTML = products.slice(0, 3).map(p => `
      <div class="catalog-card" style="cursor:pointer;" data-id="${p.id}">
        <img src="${p.image}" alt="${p.alt || p.title}">
        <div>
          <span>${p.maker || 'Independent Studio'}</span>
          <strong>${p.price}</strong>
          <h3>${p.title}</h3>
        </div>
      </div>
    `).join("");

    // Tambahkan fungsi klik menuju halaman detail produk
    grid.querySelectorAll(".catalog-card").forEach(card => {
      card.addEventListener("click", () => navigate("product-detail", { productId: card.dataset.id }));
    });
  } catch (err) {
    console.warn("Home products failed to load:", err);
  }
}