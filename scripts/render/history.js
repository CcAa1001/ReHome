// scripts/render/history.js
import { elements }                            from "../dom.js";
import { loadDatabase, getSession }            from "../storage.js";
import { getPurchaseHistory, getSalesHistory, updateOrderStatus } from "../supabaseDatabase.js";
import { showToast }                           from "../ui.js";
import { navigate }                            from "../router.js";

// ── HELPERS ───────────────────────────────────────────────────────────────────

function formatMoney(value) {
  return `$${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2, maximumFractionDigits: 2
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
    pending:   "background:rgba(253,195,154,0.25);color:#92400e",
    shipped:   "background:rgba(96,165,250,0.20);color:#1e40af",
    completed: "background:rgba(156,175,136,0.25);color:#065f46",
    cancelled: "background:rgba(220,38,38,0.10);color:#7f1d1d"
  };
  const s = styles[status] ?? styles.pending;
  return `<span style="padding:3px 10px;border-radius:999px;font-size:11px;
    font-weight:800;letter-spacing:.8px;text-transform:uppercase;${s}">${status}</span>`;
}

function skeleton(height = 120) {
  return `<div class="skeleton-card" style="height:${height}px;border-radius:16px;margin-bottom:16px;"></div>`;
}

function emptyStateHTML(icon, title, body, actionLabel = "", actionRoute = "") {
  const btn = actionLabel
    ? `<button class="primary-button" style="width:auto;padding:0 24px;"
         onclick="window.navigate && window.navigate('${actionRoute}')">
         ${actionLabel}
       </button>`
    : "";
  return `
    <div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <h3>${title}</h3>
      <p>${body}</p>
      ${btn}
    </div>`;
}

// ── SELLER METRICS ────────────────────────────────────────────────────────────

function calculateMetrics(sales) {
  const totalRevenue = sales.reduce(
    (sum, i) => sum + Number(i.price ?? 0) * Number(i.quantity ?? 1), 0
  );
  const uniqueOrders = new Set(sales.map((i) => i.orders?.id).filter(Boolean)).size;
  const carbonSaved  = sales.length * 2.5;
  return { totalRevenue, uniqueOrders, carbonSaved };
}

function renderMetricsGrid(sales) {
  const { totalRevenue, uniqueOrders, carbonSaved } = calculateMetrics(sales);
  return `
    <div class="metrics-grid">
      <div class="metric-card">
        <span>Total Revenue</span>
        <strong>${formatMoney(totalRevenue)}</strong>
      </div>
      <div class="metric-card">
        <span>Orders Fulfilled</span>
        <strong>${uniqueOrders}</strong>
      </div>
      <div class="metric-card">
        <span>Carbon Saved</span>
        <strong>${carbonSaved.toFixed(1)} kg</strong>
      </div>
    </div>`;
}

// ── PURCHASE HISTORY ──────────────────────────────────────────────────────────

function renderOrderCard(order) {
  const items    = order.order_items ?? [];
  const itemRows = items.length
    ? items.map((i) => {
        const isCompleted = order.status === "completed";
        const reviewBtn   = isCompleted
          ? `<button class="review-btn" data-order-id="${order.id}" data-product-id="${i.product_id}"
               style="font-size:11px;padding:2px 8px;border:1px solid #d6d3d1;border-radius:6px;
               background:transparent;cursor:pointer;color:#78716c;">★ Leave a Review</button>`
          : "";
        return `
          <li style="display:flex;justify-content:space-between;align-items:center;
            padding:8px 0;border-bottom:1px solid rgba(197,200,188,.2);font-size:13px;">
            <div>
              <span>${i.title} <span style="color:#78716c">× ${i.quantity}</span></span>
              <div style="margin-top:4px;">${reviewBtn}</div>
            </div>
            <strong>${formatMoney(Number(i.price) * Number(i.quantity))}</strong>
          </li>`;
      }).join("")
    : `<li style="font-size:13px;color:#78716c;padding:8px 0;">No item details available.</li>`;

  return `
    <article class="history-panel" style="padding:24px;border-radius:16px;margin-bottom:16px;">
      <header style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;">
        <div>
          <span style="font-size:11px;font-weight:800;letter-spacing:1px;
            text-transform:uppercase;color:#78716c;">Order · ${formatDate(order.created_at)}</span>
          <p style="margin:4px 0 0;font-size:12px;color:#a8a29e;">ID: ${order.id}</p>
        </div>
        ${statusPill(order.status)}
      </header>
      <ul style="list-style:none;padding:0;margin:0 0 16px;">${itemRows}</ul>
      <div style="display:flex;justify-content:flex-end;">
        <strong>Total: ${formatMoney(order.total)}</strong>
      </div>
    </article>`;
}

export async function renderPurchaseHistory() {
  if (!elements.historyList) return;

  elements.historyList.innerHTML = skeleton(120) + skeleton(120);

  const remoteOrders = await getPurchaseHistory();
  const localHistory = loadDatabase().history ?? [];
  const orders       = remoteOrders ?? localHistory;

  if (!orders.length) {
    elements.historyList.innerHTML = emptyStateHTML(
      "🛍️", "No purchases yet",
      "Your order history will appear here after your first checkout.",
      "Browse Products", "shop"
    );
    return;
  }

  elements.historyList.innerHTML = orders.map((item) =>
    item.date && item.title ? renderLocalHistoryCard(item) : renderOrderCard(item)
  ).join("");

  // Bind review buttons
  elements.historyList.querySelectorAll(".review-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      showToast("⭐ Review feature coming soon!");
    });
  });
}

function renderLocalHistoryCard(item) {
  return `
    <article class="history-card">
      <div>
        <header><time>${item.date}</time>${statusPill(item.status ?? "pending")}</header>
        <h3>${item.title}</h3>
        <p>${item.description ?? ""}</p>
      </div>
      <div>
        <strong>${item.price}</strong>
        <button class="ghost-button" type="button">${item.action ?? "View"}</button>
      </div>
    </article>`;
}

// ── SALES HISTORY ─────────────────────────────────────────────────────────────

function renderSaleRow(item) {
  const order  = item.orders ?? {};
  const isPending = !order.status || order.status === "pending";

  return `
    <article class="history-panel" style="padding:20px;border-radius:16px;margin-bottom:12px;">
      <div style="display:flex;align-items:center;gap:16px;">
        ${item.product?.image_url
          ? `<img src="${item.product.image_url}" alt="${item.product?.title ?? ""}"
                style="width:56px;height:56px;object-fit:cover;border-radius:8px;flex-shrink:0;">`
          : `<div style="width:56px;height:56px;border-radius:8px;background:#e7e5e4;flex-shrink:0;"></div>`
        }
        <div style="flex:1;min-width:0;">
          <p style="margin:0;font-size:14px;font-weight:600;white-space:nowrap;
            overflow:hidden;text-overflow:ellipsis;">
            ${item.product?.title ?? "Product"}
          </p>
          <span style="font-size:12px;color:#78716c;">
            ${formatDate(order.created_at)} · Qty ${item.quantity}
          </span>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <strong>${formatMoney(Number(item.price) * Number(item.quantity))}</strong>
          <div style="margin-top:4px;">${statusPill(order.status)}</div>
        </div>
      </div>
      ${isPending ? `
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(197,200,188,.2);">
          <button class="ship-button"
            data-order-id="${order.id}"
            data-sale-item-id="${item.id}">
            📦 Mark as Shipped
          </button>
        </div>` : ""}
    </article>`;
}

export async function renderSalesHistory(container) {
  if (!container) return;

  const role = getSession()?.role ?? "buyer";
  if (role !== "seller" && role !== "admin") {
    container.innerHTML = emptyStateHTML(
      "🔒", "Seller access only",
      "Switch to a Seller role in your profile settings to view this section."
    );
    return;
  }

  container.innerHTML = skeleton(80) + skeleton(80);

  const sales = await getSalesHistory() ?? [];

  if (!sales.length) {
    container.innerHTML = emptyStateHTML(
      "📊", "No sales yet",
      "Sales will appear here once buyers check out your listings."
    );
    return;
  }

  // Metrics header
  const metricsHTML = renderMetricsGrid(sales);
  container.innerHTML = metricsHTML + sales.map(renderSaleRow).join("");

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
        // Update pill visual tanpa re-fetch semua
        const pill = btn.closest("article").querySelector("[style*='border-radius:999px']");
        if (pill) {
          pill.textContent = "shipped";
          pill.style.cssText = "padding:3px 10px;border-radius:999px;font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;background:rgba(96,165,250,0.20);color:#1e40af";
        }
        btn.closest("div[style*='border-top']")?.remove();
      } catch {
        showToast("Could not update order. Please try again.");
        btn.disabled    = false;
        btn.textContent = "📦 Mark as Shipped";
      }
    });
  });
}

export const renderHistory = renderPurchaseHistory;