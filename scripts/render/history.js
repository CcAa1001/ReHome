// scripts/render/history.js
import { elements }                            from "../dom.js";
import { loadDatabase, getSession }            from "../storage.js";
import { getPurchaseHistory, getSalesHistory, updateOrderStatus } from "../supabaseDatabase.js";
import { showToast }                           from "../ui.js";
import { navigate }                            from "../router.js";

// ── HELPERS ───────────────────────────────────────────────────────────────────

function formatMoney(value) {
  return `$${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 0, maximumFractionDigits: 2
  })}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric"
  });
}

function statusPill(status = "pending") {
  const styles = {
    pending:   "color: #d97706;", // Orange
    transit:   "color: #d97706;", // Orange
    shipped:   "color: #2563eb;", // Biru
    delivered: "color: #3d5a30;", // Hijau
    completed: "color: #3d5a30;", // Hijau
    cancelled: "color: #dc2626;"  // Merah
  };
  const s = styles[status.toLowerCase()] ?? styles.pending;
  return `<span style="${s}">${status}</span>`;
}

// ── PURCHASE HISTORY (PROFILE PAGE) ───────────────────────────────────────────

export async function renderPurchaseHistory() {
  const container = document.querySelector("[data-history-list]");
  if (!container) return;

  container.innerHTML = `
    <article class="history-card">
      <img src="assets/vase.jpg" alt="Artisan Clay Vase">
      <div class="history-details">
        <header>
          <time>May 14, 2026</time>
          <span class="status-pill delivered">Delivered</span>
        </header>
        <h3>Artisan Clay Vase</h3>
        <p>Purchased from Elena Studio.</p>
      </div>
      <strong>$85</strong>
    </article>

    <article class="history-card">
      <img src="assets/figma-export/50c650dc19d53b235c064dcad7dc23f8b08e5668.png" alt="Curated Oak Lounge Chair">
      <div class="history-details">
        <header>
          <time>May 09, 2026</time>
          <span class="status-pill transit">In transit</span>
        </header>
        <h3>Curated Oak Lounge Chair</h3>
        <p>Carbon-neutral courier.</p>
      </div>
      <strong>$1,240</strong>
    </article>
  `;
}

// ── SALES HISTORY (SELLER DASHBOARD) ──────────────────────────────────────────

function renderSaleRow(item) {
  const order = item.orders ?? {};
  const isPending = !order.status || order.status === "pending";

  return `
    <article class="history-card" style="margin-bottom:16px;">
      <div style="display:flex; align-items:center; gap:24px; width:100%;">
        ${item.product?.image_url
          ? `<img src="${item.product.image_url}" alt="${item.product?.title ?? ""}" style="width:88px;height:88px;object-fit:cover;border-radius:12px;background:#f0ede8;flex-shrink:0;">`
          : `<div style="width:88px;height:88px;border-radius:12px;background:#f0ede8;flex-shrink:0;"></div>`
        }
        <div style="flex:1;">
          <header style="margin-bottom:8px;">
            <time>${formatDate(order.created_at)}</time>
            ${statusPill(order.status || "Pending")}
          </header>
          <h3 style="font-size:20px; margin:0 0 4px;">${item.product?.title ?? "Product"}</h3>
          <p style="margin:0;">Qty: ${item.quantity}</p>
        </div>
        <div style="text-align:right;">
          <strong style="font-size:28px;">${formatMoney(Number(item.price) * Number(item.quantity))}</strong>
          ${isPending ? `
            <div style="margin-top:12px;">
              <button class="ghost-button ship-button" data-order-id="${order.id}" style="padding:8px 16px;font-size:12px;">Mark as Shipped</button>
            </div>` : ""}
        </div>
      </div>
    </article>`;
}

export async function renderSalesHistory(container) {
  if (!container) return;

  const role = getSession()?.role ?? "buyer";
  if (role !== "seller" && role !== "admin") {
    container.innerHTML = `
      <div style="padding: 48px; text-align: center; border: 1px dashed rgba(197, 200, 188, 0.5); border-radius: 16px;">
        <h3>🔒 Seller access only</h3>
        <p style="color: #78716c;">Switch to a Seller role in your profile settings to view this section.</p>
      </div>`;
    return;
  }

  const sales = await getSalesHistory() ?? [];

  if (!sales.length) {
    container.innerHTML = `
      <div style="padding: 48px; text-align: center; border: 1px dashed rgba(197, 200, 188, 0.5); border-radius: 16px;">
        <h3>📊 No sales yet</h3>
        <p style="color: #78716c;">Sales will appear here once buyers check out your listings.</p>
      </div>`;
    return;
  }

  // Generate baris sales history
  container.innerHTML = sales.map(renderSaleRow).join("");

  // Bind "Mark as Shipped" buttons
  container.querySelectorAll(".ship-button").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const orderId = btn.dataset.orderId;
      if (!orderId) return;

      btn.disabled    = true;
      btn.textContent = "Processing...";

      try {
        await updateOrderStatus(orderId, "shipped");
        showToast("Order marked as shipped! 📦");
        btn.closest("div").remove(); // Hilangkan tombol setelah sukses di-update
      } catch {
        showToast("Could not update order. Please try again.");
        btn.disabled    = false;
        btn.textContent = "Mark as Shipped";
      }
    });
  });
}

// Menghubungkan fungsi utama agar bisa dipanggil app.js
export const renderHistory = renderPurchaseHistory;