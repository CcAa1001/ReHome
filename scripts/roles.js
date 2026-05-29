import { getSession } from "./storage.js";

const roleLabels = {
  buyer: "BUYER",
  seller: "SELLER",
  admin: "ADMIN"
};

function getCurrentRole() {
  return getSession()?.role ?? "buyer";
}

export function applyRoleUI() {
  const role = getCurrentRole();
  const canUseSellerTools = role === "seller" || role === "admin";
  const canUseAdminTools = role === "admin";

  document.querySelectorAll("[data-role-nav='seller']").forEach((element) => {
    element.hidden = !canUseSellerTools;
  });

  document.querySelectorAll("[data-role-nav='admin']").forEach((element) => {
    element.hidden = !canUseAdminTools;
  });

  document.querySelectorAll("[data-role-badge]").forEach((badge) => {
    badge.textContent = roleLabels[role] ?? roleLabels.buyer;
  });

  document.documentElement.dataset.role = role;
}
