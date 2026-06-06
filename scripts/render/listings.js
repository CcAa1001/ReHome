import { sanitizeShortText, sanitizeUrl, toSafeMoney } from "../security.js";
import { getSupabaseClient } from "../supabaseClient.js";

let currentFilter = "all";

export function setListingFilter(filter) {
  currentFilter = filter;
}

async function getProducts() {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

function createListingRow(product, itemStatus) {
  const tr = document.createElement("tr");
  const statusClass = itemStatus === "active" ? "status-active" : "status-sold";
  const displayText = itemStatus === "drafts" ? "Draft" : itemStatus === "sold" ? "Sold" : "Active";
  const safeTitle = sanitizeShortText(product.title, "Untitled item");
  const safeCategory = sanitizeShortText(product.category, "Living Room");
  const safeCondition = sanitizeShortText(product.condition, "Excellent");
  const safeImage = sanitizeUrl(product.image_url || product.image);
  const safePrice = toSafeMoney(product.price);

  tr.innerHTML = `
    <td>
      <div class="item-cell">
        <img src="${safeImage}" alt="${safeTitle}">
        <span>${safeTitle}</span>
      </div>
    </td>
    <td style="color: #78716c;">${safeCategory}</td>
    <td><strong>$${safePrice}</strong></td>
    <td style="color: #78716c;">${safeCondition}</td>
    <td><span class="status-badge ${statusClass}">${displayText}</span></td>
    <td>
      <button class="action-menu-btn" type="button" aria-label="Open listing actions">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
      </button>
    </td>
  `;

  tr.querySelector(".action-menu-btn")?.addEventListener("click", () => {
    alert(`Menu options for: ${safeTitle}`);
  });

  return tr;
}

export async function renderListings() {
  const container = document.querySelector("tbody[data-listings]");
  if (!container) return;

  try {
    const products = await getProducts();
    const productsWithStatus = products.map((product, index) => {
      let status = "active";
      if (index % 3 === 1) status = "sold";
      if (index % 3 === 2) status = "drafts";
      return { ...product, demoStatus: status };
    });

    const filteredProducts = productsWithStatus.filter((product) => {
      if (currentFilter === "all") return true;
      return product.demoStatus === currentFilter;
    });

    const displayProducts = filteredProducts.slice(0, 5);
    container.innerHTML = "";

    if (displayProducts.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding: 48px; color: #78716c;">
            No listings found in this tab.
          </td>
        </tr>`;
    } else {
      displayProducts.forEach((product) => {
        container.appendChild(createListingRow(product, product.demoStatus));
      });
    }
  } catch {
    container.innerHTML = `<tr><td colspan="6" style="text-align:center;">Failed to load listings.</td></tr>`;
  }
}
