// scripts/render/listings.js
import { getProducts } from "../supabaseDatabase.js";

// 1. Variabel penyimpan memori filter yang sedang aktif
let currentFilter = "all";

// 2. Fungsi ini otomatis dipanggil oleh app.js saat Bos klik tab di atas tabel
export function setListingFilter(filter) {
  currentFilter = filter;
}

// 3. Fungsi pembuat baris tabel
function createListingRow(product, itemStatus) {
  const tr = document.createElement("tr");
  
  // Penentuan warna label status
  let statusClass = "status-active";
  let displayText = "Active";

  if (itemStatus === "sold") {
    statusClass = "status-sold";
    displayText = "Sold";
  } else if (itemStatus === "drafts") {
    statusClass = "status-sold"; // Drafts pakai warna abu-abu yang sama dengan Sold
    displayText = "Draft";
  }

  const category = product.category || "Living Room";
  const condition = product.condition || "Excellent";

  tr.innerHTML = `
    <td>
      <div class="item-cell">
        <img src="${product.image}" alt="${product.title}">
        <span>${product.title}</span>
      </div>
    </td>
    <td style="color: #78716c;">${category}</td>
    <td><strong>${product.price}</strong></td>
    <td style="color: #78716c;">${condition}</td>
    <td><span class="status-badge ${statusClass}">${displayText}</span></td>
    <td>
      <button class="action-menu-btn" onclick="alert('Menu opsi untuk: ${product.title}')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
      </button>
    </td>
  `;
  return tr;
}

// 4. Fungsi Utama untuk Render Tabel
export async function renderListings() {
  const container = document.querySelector("tbody[data-listings]");
  if (!container) return;

  try {
    const products = await getProducts();
    
    // --- SIMULASI STATUS DEMO ---
    // Karena database dummy belum punya field 'status', kita simulasikan:
    const productsWithStatus = products.map((p, index) => {
      let status = "active";
      if (index % 3 === 1) status = "sold";
      if (index % 3 === 2) status = "drafts";
      return { ...p, demoStatus: status };
    });

    // --- LOGIC PENYARINGAN (FILTERING) ---
    const filteredProducts = productsWithStatus.filter(p => {
      if (currentFilter === "all") return true; // Tampilkan semua
      return p.demoStatus === currentFilter;    // Tampilkan yang cocok
    });

    const displayProducts = filteredProducts.slice(0, 5); // Tampilkan max 5 baris
    
    container.innerHTML = ""; // Bersihkan tabel sebelum diisi ulang
    
    // Jika data kosong setelah difilter
    if (displayProducts.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan='6' style='text-align:center; padding: 48px; color: #78716c;'>
            No listings found in this tab.
          </td>
        </tr>`;
    } else {
      // Masukkan data ke dalam tabel
      displayProducts.forEach(p => {
        container.appendChild(createListingRow(p, p.demoStatus));
      });
    }
  } catch (e) {
    container.innerHTML = "<tr><td colspan='6' style='text-align:center;'>Failed to load listings.</td></tr>";
  }
}