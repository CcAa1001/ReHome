// scripts/render/history.js
import { elements }                            from "../dom.js";
import { loadDatabase, getSession }            from "../storage.js";
import { getPurchaseHistory, getSalesHistory } from "../supabaseDatabase.js";

// ── HELPERS ───────────────────────────────────────────────────────────────────

function formatMoney(value) {
  return `$${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
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
    completed: "background:rgba(156,175,136,0.25);color:#065f46",
    cancelled: "background:rgba(220,38,38,0.10);color:#7f1d1d"
  };
  const s = styles[status] ?? styles.pending;
  return `<span style="padding:3px 10px;border-radius:999px;font-size:11px;
    font-weight:800;letter-spacing:.8px;text-transform:uppercase;${s}">${status}</span>`;
}

function skeletonCard(height = 120) {
  return `<div class="skeleton-card" style="height:${height}px;border-radius:16px;margin-bottom:16px;"></div>`;
}

function emptyState(message) {
  return `
    <article style="padding:48px 24px;text-align:center;border:1px solid rgba(197,200,188,.35);
      border-radius:16px;background:white;">
      <div style="font-size:32px;margin-bottom:12px;">📦</div>
      <h3 style="margin:0 0 8px;font-size:16px;">Nothing here yet</h3>
      <p style="margin:0;color:#78716c;font-size:14px;">${message}</p>
    </article>`;
}

// ── PURCHASE HISTORY ──────────────────────────────────────────────────────────

function renderOrderCard(order) {
  const items   = order.order_items ?? [];
  const itemRows = items.length
    ? items.map((i) => `
        <li style="display:flex;justify-content:space-between;padding:6px 0;
          border-bottom:1px solid rgba(197,200,188,.2);font-size:13px;">
          <span>${i.title} <span style="color:#78716c">× ${i.quantity}</span></span>
          <strong>${formatMoney(Number(i.price) * Number(i.quantity))}</strong>
        </li>`).join("")
    : `<li style="font-size:13px;color:#78716c;">No item details available.</li>`;

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

  elements.historyList.innerHTML = skeletonCard(120) + skeletonCard(120);

  // Coba Supabase dulu, fallback ke local database
  const remoteOrders = await getPurchaseHistory();
  const localHistory = loadDatabase().history ?? [];

  // Jika Supabase mengembalikan array (meski kosong), pakai itu.
  // Jika null (tidak login / error), pakai local history lama.
  const orders = remoteOrders ?? localHistory;

  if (!orders.length) {
    elements.historyList.innerHTML = emptyState(
      "Your purchases will appear here after checkout."
    );
    return;
  }

  // Render: bisa berupa Supabase order object ATAU local history item lama
  elements.historyList.innerHTML = orders.map((item) => {
    // Local history lama (format berbeda)
    if (item.date && item.title) {
      return renderLocalHistoryCard(item);
    }
    // Supabase order (format baru)
    return renderOrderCard(item);
  }).join("");
}

/** Backward-compat: render format history lokal lama */
function renderLocalHistoryCard(item) {
  return `
    <article class="history-card">
      <div>
        <header>
          <time>${item.date}</time>
          ${statusPill(item.status ?? "pending")}
        </header>
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
  const order = item.orders ?? {};
  const img   = item.product?.image_url;

  return `
    <article class="history-panel" style="padding:20px;border-radius:16px;margin-bottom:12px;
      display:flex;align-items:center;gap:16px;">
      ${img
        ? `<img src="${img}" alt="${item.product?.title ?? ""}"
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
        <br>${statusPill(order.status)}
      </div>
    </article>`;
}

export async function renderSalesHistory(container) {
  if (!container) return;

  const role = getSession()?.role ?? "buyer";
  if (role !== "seller" && role !== "admin") {
    container.innerHTML = emptyState("Switch to a seller role to view sales.");
    return;
  }

  container.innerHTML = skeletonCard(80);

  const sales = await getSalesHistory() ?? [];

  if (!sales.length) {
    container.innerHTML = emptyState(
      "Sales will appear here once buyers check out your listings."
    );
    return;
  }

  container.innerHTML = sales.map(renderSaleRow).join("");
}

// ── ALIAS (backward-compat untuk render/index.js yang masih memanggil renderHistory) ──

export const renderHistory = renderPurchaseHistory;