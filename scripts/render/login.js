// scripts/render/login.js
import { navigate }                             from "../router.js";
import { loginUser, registerUser }              from "../auth.js";
import { authenticate, setSession, createLocalDemoUser } from "../storage.js";
import { showToast }                            from "../ui.js";
import { getCurrentUserWithProfile }            from "../supabaseDatabase.js";
import { applyRoleUI }                          from "../roles.js";

let activeTab = "login";

const HEADINGS = {
  login:    { h: "Welcome Back",    sub: "Sign in to continue your journey of mindful luxury." },
  register: { h: "Join the Movement", sub: "Create your account and start curating consciously." }
};

export function bindLoginPage() {
  const form        = document.querySelector("[data-login-form]");
  const message     = document.querySelector("[data-form-message]");
  const nameField   = document.querySelector("[data-name-field]");
  const heading     = document.querySelector("[data-login-heading]");
  const subheading  = document.querySelector("[data-login-subheading]");
  const footer      = document.querySelector("[data-login-footer]");

  if (!form) return;

  // Tab buttons (header row)
  document.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // "Join the movement" / "Sign in" footer link
  document.querySelectorAll("[data-tab-trigger]").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tabTrigger));
  });

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

  function switchTab(tab) {
    activeTab = tab;
    const isRegister = tab === "register";

    // Update tabs visual
    document.querySelectorAll("[data-tab]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tab);
    });

    // Show/hide name field
    if (nameField) nameField.style.display = isRegister ? "block" : "none";

    // Update heading & subtitle
    if (heading)    heading.textContent    = HEADINGS[tab].h;
    if (subheading) subheading.textContent = HEADINGS[tab].sub;

    // Update submit button text
    const submitBtn = form.querySelector("[type='submit']");
    if (submitBtn) submitBtn.textContent = isRegister ? "Create Account" : "Sign In";

    // Update footer link
    if (footer) {
      footer.innerHTML = isRegister
        ? `Already have an account? <button type="button" data-tab-trigger="login">Sign in</button>`
        : `Don't have an account? <button type="button" data-tab-trigger="register">Join the movement</button>`;
      footer.querySelector("[data-tab-trigger]")
            ?.addEventListener("click", (e) => switchTab(e.target.dataset.tabTrigger));
    }
  }
}

// ── HANDLERS ─────────────────────────────────────────────────────────────────

async function handleLogin(email, password, messageEl) {
  let user;
  let isDemo = false;

  try {
    user = await loginUser(email, password);
  } catch {
    user = authenticate(email, password);
    if (!user) {
      user   = createLocalDemoUser(email, password);
      isDemo = true;
    }
    setSession(user);
  }

  if (user?.id && !isDemo) {
    const full = await getCurrentUserWithProfile();
    if (full) setSession(full);
  }

  applyRoleUI();
  showToast(isDemo
    ? `Welcome, ${user.name}! (Demo mode)`
    : `Welcome back, ${user.name ?? user.email}!`);
  await navigateAfterAuth();
}

async function handleRegister(email, password, name, messageEl) {
  if (!name)               throw new Error("Please enter your name.");
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