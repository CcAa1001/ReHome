// scripts/render/home.js
import { navigate, setRouteParams } from "../router.js";
import { getSupabaseClient } from "../supabaseClient.js";

export async function renderHome() {
  const container = document.getElementById("router-view");
  if (!container) return;

  // 1. HIDUPKAN SMART RECOMMENDATION DARI DATABASE
  try {
    const supabase = await getSupabaseClient();
    
    // Ambil data produk
    const { data: products, error } = await supabase.from('products').select('*');
    if (error) throw error;

    if (products && products.length > 0) {
      // Acak urutan dan ambil tepat 3 item (karena desain grid kita 3 kolom)
      const shuffled = products.sort(() => 0.5 - Math.random()).slice(0, 3);
      
      const recGrid = container.querySelector(".rec-grid");
      if (recGrid) {
        // Kita pertahankan variasi background dari desain HTML asli Bos
        const bgClasses = ["white-bg", "dark-bg", "red-bg"];
        
        // Timpa isi HTML statis dengan data dinamis
        recGrid.innerHTML = shuffled.map((p, index) => {
          const bgClass = bgClasses[index % bgClasses.length];
          const imgUrl = p.image_url || 'assets/chair.jpg';
          const maker = p.maker || 'CURATED FIND';
          
          return `
            <article class="rec-card" data-id="${p.id}" style="cursor: pointer;">
              <div class="rec-img ${bgClass}">
                <img src="${imgUrl}" alt="${p.title}" style="width: 80%; height: 80%; object-fit: contain;">
              </div>
              <div class="rec-info">
                <div><span>${maker}</span><h3>${p.title}</h3></div>
                <strong>$${p.price}</strong>
              </div>
            </article>
          `;
        }).join("");

        // Berikan fitur "Klik untuk masuk ke detail" pada setiap kartu
        recGrid.querySelectorAll(".rec-card").forEach(card => {
          card.addEventListener("click", () => {
            setRouteParams({ productId: card.dataset.id });
            navigate("product-detail");
          });
        });
      }
    }
  } catch (err) {
    console.warn("Gagal memuat rekomendasi dinamis:", err);
  }

  // 2. AKTIFKAN SEMUA TOMBOL ROUTE LAINNYA DI HOME (Misal: Try Scanner, View Gallery)
  container.querySelectorAll("[data-route]").forEach(btn => {
    // Hindari bentrok dengan kartu yang sudah kita pasangi event click di atas
    if (!btn.classList.contains('rec-card')) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        navigate(btn.dataset.route);
      });
    }
  });
}