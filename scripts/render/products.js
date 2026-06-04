// scripts/render/products.js
import { navigate } from "../router.js";

export async function renderProducts() {
  const container = document.getElementById("shop-catalog");
  const toggles = document.querySelectorAll("#shop-view-toggles button");
  if (!container) return;

  // Data statis yang fotokopi 100% dari gambar 24f963
  const dummyProducts = [
    { brand: "HAY DESIGN", title: "About A Chair 22", price: "$185", img: "assets/figma-export/50c650dc19d53b235c064dcad7dc23f8b08e5668.png" },
    { brand: "MUUTO", title: "Pull Floor Lamp", price: "$420", img: "assets/figma-export/c92ff17556827d47a8e24c0f458a0824ae243188.png" },
    { brand: "FERM LIVING", title: "Grib Toolbox Vase", price: "$85", img: "assets/figma-export/70e1f26af8d8c8a801bc699d95272597eb1791a6.png" },
    { brand: "CARL HANSEN", title: "Wishbone Chair", price: "$890", img: "assets/figma-export/44087ad14826697196b8166297cc11af65cda235.jpg" },
    { brand: "FRITZ HANSEN", title: "Drop Leaf Table", price: "$1,100", img: "assets/figma-export/2e09933e727252961828b90b8f665940c6212fbe.jpg" },
    { brand: "MENU", title: "Offset Stool", price: "$240", img: "assets/figma-export/2c599988de934055ead448b9abf9204292e752e2.png" }
  ];

  // Fungsi Cetak Kartu
  function renderCards() {
    container.innerHTML = dummyProducts.map(p => `
      <article class="prod-card">
        <img class="prod-img" src="${p.img}" alt="${p.title}">
        <div class="prod-info">
          <span>${p.brand}</span>
          <h3>${p.title}</h3>
          <strong>${p.price}</strong>
        </div>
      </article>
    `).join("");

    container.querySelectorAll(".prod-card").forEach(card => {
      card.addEventListener("click", () => navigate("product-detail"));
    });
  }

  // Tampilkan data pertama kali
  renderCards();

  // Fungsi Toggle Grid / List
  toggles.forEach(btn => {
    btn.addEventListener("click", () => {
      toggles.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      if (btn.dataset.viewMode === "list") {
        container.classList.add("list-view");
      } else {
        container.classList.remove("list-view");
      }
    });
  });
}