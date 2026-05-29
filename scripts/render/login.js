// scripts/render/login.js
import { navigate } from "../router.js";
import { loginUser, registerUser } from "../auth.js";
import { authenticate, setSession, hasSession } from "../storage.js";
import { showToast } from "../ui.js";
import { getCurrentUserWithProfile } from "../supabaseDatabase.js";
import { applyRoleUI } from "../roles.js";

// ── STATE LOKAL ───────────────────────────────────────────────────────────────

let activeTab = "login"; // "login" | "register"

// ── BIND ──────────────────────────────────────────────────────────────────────

export function bindLoginPage() {
  const form        = document.querySelector("[data-login-form]");
  const tabLogin    = document.querySelector("[data-tab='login']");
  const tabRegister = document.querySelector("[data-tab='register']");
  const message     = document.querySelector("[data-form-message]");
  const nameField   = document.querySelector("[data-name-field]");

  if (!form) return; // view belum ada di DOM

  // Ganti tab Login ↔ Register
  tabLogin?.addEventListener("click", () => switchTab("login", nameField, tabLogin, tabRegister));
  tabRegister?.addEventListener("click", () => switchTab("register", nameField, tabLogin, tabRegister));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "";

    const data     = new FormData(form);
    const email    = String(data.get("email")).trim().toLowerCase();
    const password = String(data.get("password"));
    const name     = String(data.get("name") ?? "").trim();

    const submitBtn = form.querySelector("[type='submit']");
    submitBtn.disabled = true;

    try {
      if (activeTab === "login") {
        await handleLogin(email, password);
      } else {
        await handleRegister(email, password, name, message);
      }
    } catch (error) {
      message.textContent = error.message ?? "Something went wrong.";
    } finally {
      submitBtn.disabled = false;
    }
  });
}

// ── HANDLERS ─────────────────────────────────────────────────────────────────

async function handleLogin(email, password) {
  let user;

  try {
    user = await loginUser(email, password);          // coba Supabase dulu
  } catch {
    user = authenticate(email, password);             // fallback local demo
    if (!user) throw new Error("Email atau password tidak cocok.");
    setSession(user);
  }

  // Jika Supabase berhasil, ambil profile lengkap
  if (user?.id || user?.userId) {
    const full = await getCurrentUserWithProfile();
    if (full) setSession(full);
  }

  applyRoleUI();

  showToast(`Welcome back, ${user.name ?? user.email}!`);
  await navigateAfterAuth();
}

async function handleRegister(email, password, name, messageEl) {
  if (!name) throw new Error("Please enter your name.");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");

  try {
    await registerUser(email, password, name);
    showToast("Account created! Welcome to ReHome.");
    await navigateAfterAuth();
  } catch (error) {
    // Email konfirmasi required
    if (error.message.includes("Check your email")) {
      messageEl.textContent = "📬 Check your email to confirm your account.";
      return;
    }
    throw error;
  }
}

async function navigateAfterAuth() {
  // Lazy import agar tidak ada circular dependency
  const { renderAll } = await import("./index.js");
  const { showApp }   = await import("../router.js");
  await showApp("home", renderAll);
  applyRoleUI();
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function switchTab(tab, nameField, tabLogin, tabRegister) {
  activeTab = tab;
  const isRegister = tab === "register";

  if (nameField) nameField.style.display = isRegister ? "block" : "none";
  tabLogin?.classList.toggle("active", !isRegister);
  tabRegister?.classList.toggle("active", isRegister);

  const submitBtn = document.querySelector("[data-login-form] [type='submit']");
  if (submitBtn) submitBtn.textContent = isRegister ? "Create Account" : "Sign In";
}
