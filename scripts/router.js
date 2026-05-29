// scripts/router.js
import { elements } from "./dom.js";
import { getSession } from "./storage.js";
import { showToast } from "./ui.js";

const roleRoutes = {
  seller: ["new-listing", "sales-history", "seller-support"],
  admin: ["admin"]
};

// ── ROUTE PARAMS ──────────────────────────────────────────────────────────────

let _currentParams = {};

/** Ambil params dari navigate() terakhir, misal: { productId: "123" } */
export function getRouteParams() {
  return _currentParams;
}

// ── GUARD ─────────────────────────────────────────────────────────────────────

function canAccess(route) {
  const role = getSession()?.role ?? "buyer";
  if (role === "admin") return true;
  if (roleRoutes.admin.includes(route)) return false;
  if (roleRoutes.seller.includes(route)) return role === "seller";
  return true;
}

// ── NAVIGATE ──────────────────────────────────────────────────────────────────

/**
 * @param {string} route   - Nama view, misal: "curated"
 * @param {object} [params] - Data opsional, misal: { productId: "abc" }
 */
export function navigate(route, params = {}) {
  if (!canAccess(route)) {
    showToast("Switch to a seller or admin demo role to open that area.");
    route = "settings";
  }

  _currentParams = params; // simpan sebelum render

  elements.views.forEach((view) => {
    view.classList.toggle("is-active", view.dataset.view === route);
  });

  elements.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.route === route);
  });

  window.scrollTo({ top: 0, behavior: "auto" });
}

export const Maps = navigate;

export async function showApp(route = "home", renderAll) {
  elements.login.hidden = true;
  elements.app.hidden = false;
  await renderAll();
  navigate(route);
}
