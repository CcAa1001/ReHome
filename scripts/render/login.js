// scripts/render/login.js
import { navigate }                    from "../router.js";
import { loginUser, registerUser }     from "../auth.js";
import { authenticate, setSession, createLocalDemoUser } from "../storage.js"; // ← tambah createLocalDemoUser
import { showToast }                   from "../ui.js";
import { getCurrentUserWithProfile }   from "../supabaseDatabase.js";
import { applyRoleUI }                 from "../roles.js";

let activeTab = "login";

export function bindLoginPage() {
  const form        = document.querySelector("[data-login-form]");
  const tabLogin    = document.querySelector("[data-tab='login']");
  const tabRegister = document.querySelector("[data-tab='register']");
  const message     = document.querySelector("[data-form-message]");
  const nameField   = document.querySelector("[data-name-field]");

  if (!form) return;

  tabLogin?.addEventListener("click",    () => switchTab("login",    nameField, tabLogin, tabRegister));
  tabRegister?.addEventListener("click", () => switchTab("register", nameField, tabLogin, tabRegister));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "";

    const data      = new FormData(form);
    const email     = String(data.get("email")).trim().toLowerCase();
    const password  = String(data.get("password"));
    const name      = String(data.get("name") ?? "").trim();
    const submitBtn = form.querySelector("[type='submit']");

    submitBtn.disabled = true;

    try {
      if (activeTab === "login") {
        await handleLogin(email, password, message);
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

async function handleLogin(email, password, messageEl) {
  let user;
  let isDemo = false;

  try {
    // Jalur 1: Supabase auth
    user = await loginUser(email, password);
  } catch {
    // Jalur 2: Local demo database
    user = authenticate(email, password);

    if (!user) {
      // Jalur 3: Auto-register sebagai demo user (frictionless testing)
      user    = createLocalDemoUser(email, password);
      isDemo  = true;
    }

    setSession(user);
  }

  // Jika Supabase berhasil, ambil profile lengkap
  if (user?.id && !isDemo) {
    const full = await getCurrentUserWithProfile();
    if (full) setSession(full);
  }

  applyRoleUI();

  const greeting = isDemo
    ? `Welcome, ${user.name}! (Demo mode — data is local only)`
    : `Welcome back, ${user.name ?? user.email}!`;

  showToast(greeting);
  await navigateAfterAuth();
}

async function handleRegister(email, password, name, messageEl) {
  if (!name)              throw new Error("Please enter your name.");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");

  try {
    await registerUser(email, password, name);
    showToast("Account created! Welcome to ReHome.");
    await navigateAfterAuth();
  } catch (error) {
    if (error.message.includes("Check your email")) {
      messageEl.textContent = "📬 Check your email to confirm your account.";
      return;
    }
    throw error;
  }
}

async function navigateAfterAuth() {
  const { renderAll } = await import("./index.js");
  const { showApp }   = await import("../router.js");
  await showApp("home", renderAll);
  applyRoleUI();
}

function switchTab(tab, nameField, tabLogin, tabRegister) {
  activeTab = tab;
  const isRegister = tab === "register";

  if (nameField) nameField.style.display = isRegister ? "block" : "none";
  tabLogin?.classList.toggle("active",    !isRegister);
  tabRegister?.classList.toggle("active",  isRegister);

  const submitBtn = document.querySelector("[data-login-form] [type='submit']");
  if (submitBtn) submitBtn.textContent = isRegister ? "Create Account" : "Sign In";
}