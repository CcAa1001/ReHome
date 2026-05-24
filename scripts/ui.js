import { elements } from "./dom.js";

let toastTimer;

export function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  elements.toast.classList.add("is-visible");

  toastTimer = setTimeout(() => {
    elements.toast.classList.remove("is-visible");
    elements.toast.hidden = true;
  }, 2600);
}
