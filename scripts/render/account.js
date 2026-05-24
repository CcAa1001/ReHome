import { elements } from "../dom.js";
import { getSession } from "../storage.js";

export function renderAccount() {
  const session = getSession() ?? {
    name: "Vivian",
    role: "buyer"
  };

  elements.userName.textContent = session.name ?? "Vivian";
  elements.roleBadge.textContent = (session.role ?? "buyer").toUpperCase();

  if (elements.profileForm) {
    elements.profileForm.name.value = session.name ?? "Vivian";
    elements.profileForm.location.value = session.location ?? "Copenhagen, DK";
    elements.profileForm.role.value = session.role ?? "buyer";
  }
}
