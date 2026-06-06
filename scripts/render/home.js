import { navigate, setRouteParams } from "../router.js";
import { sanitizeShortText, sanitizeUrl, toSafeMoney } from "../security.js";
import { getSupabaseClient } from "../supabaseClient.js";

export async function renderHome() {
  const container = document.getElementById("router-view");
  if (!container) return;

  try {
    const supabase = await getSupabaseClient();
    const { data: products, error } = await supabase.from("products").select("*");
    if (error) throw error;

    if (products && products.length > 0) {
      const shuffled = [...products].sort(() => 0.5 - Math.random()).slice(0, 3);
      const recGrid = container.querySelector(".rec-grid");

      if (recGrid) {
        const bgClasses = ["white-bg", "dark-bg", "red-bg"];

        recGrid.innerHTML = shuffled.map((product, index) => {
          const bgClass = bgClasses[index % bgClasses.length];
          const safeId = sanitizeShortText(product.id);
          const safeImgUrl = sanitizeUrl(product.image_url);
          const safeMaker = sanitizeShortText(product.maker, "CURATED FIND");
          const safeTitle = sanitizeShortText(product.title, "Untitled item");
          const safePrice = toSafeMoney(product.price);

          return `
            <article class="rec-card" data-id="${safeId}" style="cursor: pointer;">
              <div class="rec-img ${bgClass}">
                <img src="${safeImgUrl}" alt="${safeTitle}" style="width: 80%; height: 80%; object-fit: contain;">
              </div>
              <div class="rec-info">
                <div><span>${safeMaker}</span><h3>${safeTitle}</h3></div>
                <strong>$${safePrice}</strong>
              </div>
            </article>
          `;
        }).join("");

        recGrid.querySelectorAll(".rec-card").forEach((card) => {
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

  container.querySelectorAll("[data-route]").forEach((btn) => {
    if (!btn.classList.contains("rec-card")) {
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        navigate(btn.dataset.route);
      });
    }
  });
}
