import { showApp } from "../router.js";

export function bindLoginPage() {
  const form = document.querySelector("[data-login-form]");
  if (!form) return;
  
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    // BYPASS: Langsung terobos masuk ke dalam aplikasi!
    await showApp("home");
  });
}