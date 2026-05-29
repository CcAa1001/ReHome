// scripts/render/products.js
import { navigate } from "../router.js";
import { getProducts } from "../supabaseDatabase.js";

// FIX: Fungsi ini wajib ada agar app.js tidak crash (SyntaxError)
export function setCategoryFilter(category) {
  // Tidak perlu isi karena filter sekarang menggunakan checkbox langsung
}

let isListView = false;
let currentSort = "Newest Added";

// ── MEMBUAT KARTU PRODUK ──
function createProductCard(product) {
  const card = document.createElement("div");
  card.className = "catalog-card route-btn";
  card.dataset.target = "curated";
  card.innerHTML = `
    <img src="${product.image}" alt="${product.alt || product.title}">
    <div>
      <span>${product.maker || "Independent Studio"}</span>
      <strong>${product.price}</strong>
      <h3>${product.title}</h3>
    </div>
  `;
  card.addEventListener("click", () => navigate("curated", { productId: product.id }));
  return card;
}

// ── LOGIC RENDER UTAMA ──
export async function renderProducts() {
  const shopContainer = document.querySelector("[data-catalog-products]");
  const homeContainer = document.querySelector("#home-product-grid");

  let products = [];
  try { products = await getProducts(); } 
  catch (error) { console.warn("Failed to load products"); return; }

  // Render 3 item di Home
  if (homeContainer) {
    homeContainer.innerHTML = "";
    products.slice(0, 3).forEach(p => homeContainer.appendChild(createProductCard(p)));
  }

  // Render Shop & Bind Filter Logic
  if (shopContainer) {
    bindShopLogic(products);
    updateShopDisplay(products);
    bindCuratedThumbnails(); // Bind thumbnail di detail produk
  }
}

// ── LOGIC FILTER, SORTING, & VIEW TOGGLE ──
function bindShopLogic(allProducts) {
  const shopView = document.querySelector('[data-view="shop"]');
  if (!shopView || shopView.dataset.bound) return;
  shopView.dataset.bound = "true";

  // 1. Grid / List View Toggles
  const viewBtns = document.querySelectorAll(".view-toggles button");
  const catalogGrid = document.querySelector(".catalog-grid");
  
  if (viewBtns.length >= 2) {
    viewBtns[0].addEventListener("click", () => {
      isListView = false;
      viewBtns[0].classList.add("active");
      viewBtns[1].classList.remove("active");
      catalogGrid.classList.remove("list-view");
    });
    viewBtns[1].addEventListener("click", () => {
      isListView = true;
      viewBtns[1].classList.add("active");
      viewBtns[0].classList.remove("active");
      catalogGrid.classList.add("list-view");
    });
  }

  // 2. Sort Dropdown
  const sortSelect = document.querySelector(".sort-dropdown select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      updateShopDisplay(allProducts);
    });
  }

  // 3. Price Slider Logic (Visual + Filter)
  const sliders = document.querySelectorAll('input[type="range"]');
  const priceBoxes = document.querySelectorAll('.price-box');
  
  sliders.forEach(slider => {
    slider.addEventListener("input", () => {
      let val1 = parseInt(sliders[0].value);
      let val2 = parseInt(sliders[1].value);
      let minVal = Math.min(val1, val2);
      let maxVal = Math.max(val1, val2);
      
      if(priceBoxes.length >= 2) {
        priceBoxes[0].innerHTML = `<span>$</span> ${minVal}`;
        priceBoxes[1].innerHTML = `<span>$</span> ${maxVal === 5000 ? '5000+' : maxVal}`;
      }
    });
    
    slider.addEventListener("change", () => updateShopDisplay(allProducts));
  });

  // 4. Checkbox Filter (Kategori & Kondisi)
  const checkboxes = shopView.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.addEventListener("change", () => updateShopDisplay(allProducts));
  });
}

// ── FUNGSI UPDATE DATA KATALOG ──
function updateShopDisplay(allProducts) {
  const shopContainer = document.querySelector("[data-catalog-products]");
  if (!shopContainer) return;

  // Tarik data slider
  const sliders = document.querySelectorAll('input[type="range"]');
  let minPrice = 0, maxPrice = 5000;
  if (sliders.length >= 2) {
    minPrice = Math.min(sliders[0].value, sliders[1].value);
    maxPrice = Math.max(sliders[0].value, sliders[1].value);
  }

  // Tarik data checkbox
  const checkedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(cb => cb.value);

  // Filter Produk
  let filtered = allProducts.filter(p => {
    const priceNum = parseInt((p.price || "0").replace(/[^0-9]/g, ""));
    const matchPrice = priceNum >= minPrice && (maxPrice >= 5000 || priceNum <= maxPrice);
    const matchCat = checkedCategories.includes("all") || checkedCategories.some(cat => p.category?.toLowerCase().includes(cat));

    return matchPrice && matchCat;
  });

  // Sorting Produk
  if (currentSort === "Price: Low to High") {
    filtered.sort((a,b) => parseInt((a.price||"0").replace(/[^0-9]/g,"")) - parseInt((b.price||"0").replace(/[^0-9]/g,"")));
  } else if (currentSort === "Price: High to Low") {
    filtered.sort((a,b) => parseInt((b.price||"0").replace(/[^0-9]/g,"")) - parseInt((a.price||"0").replace(/[^0-9]/g,"")));
  }

  // Render ke layar
  shopContainer.innerHTML = "";
  filtered.forEach(p => shopContainer.appendChild(createProductCard(p)));
}

// ── LOGIC KLIK THUMBNAIL (CURATED MENU) ──
function bindCuratedThumbnails() {
  const mainImg = document.querySelector(".main-product-image");
  const thumbs = document.querySelectorAll(".thumb-row img");
  
  if(mainImg && thumbs.length > 0) {
    thumbs.forEach(thumb => {
      thumb.addEventListener("click", () => {
        mainImg.src = thumb.src;
        thumbs.forEach(t => t.style.opacity = "0.6");
        thumb.style.opacity = "1";
      });
    });
  }
}