import { elements } from "./dom.js";
import { getSession } from "./storage.js";
import { showToast } from "./ui.js";

const roleRoutes = {
  seller: ["new-listing", "sales-history", "seller-support"],
  admin: ["admin"]
};

function canAccess(route) {
  const role = getSession()?.role ?? "buyer";
  if (role === "admin") {
    return true;
  }

  if (roleRoutes.admin.includes(route)) {
    return false;
  }

  if (roleRoutes.seller.includes(route)) {
    return role === "seller";
  }

  return true;
}

export function navigate(route) {
  if (!canAccess(route)) {
    showToast("Switch to a seller or admin demo role to open that area.");
    route = "settings";
  }

  elements.views.forEach((view) => {
    view.classList.toggle("is-active", view.dataset.view === route);
  });

  elements.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.route === route);
  });

  window.scrollTo({ top: 0, behavior: "auto" });
}

export async function showApp(route = "home", renderAll) {
  elements.login.hidden = true;
  elements.app.hidden = false;
  await renderAll();
  navigate(route);
}
