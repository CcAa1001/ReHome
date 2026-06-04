// scripts/render/login.js
import { showApp } from "../router.js";
import { loginUser, registerUser, loginWithProvider, resetPassword } from "../auth.js"; // ← add resetPassword

// Mencegah event listener ganda
let isLoginBound = false;

export function bindLoginPage() {
  if (isLoginBound) return;
  isLoginBound = true;

  document.addEventListener("click", async (e) => {
    
    // -- 1. Navigasi Pindah Layar (Join the movement <-> Sign in) --
    const navBtn = e.target.closest("[data-nav-to]");
    if (navBtn) {
      e.preventDefault();
      const target = navBtn.getAttribute("data-nav-to");
      const loginSection = document.getElementById("login");
      const registerSection = document.getElementById("register");
      
      if (target === "register" && loginSection && registerSection) {
        loginSection.hidden = true;
        registerSection.hidden = false;
      } else if (target === "login" && loginSection && registerSection) {
        registerSection.hidden = true;
        loginSection.hidden = false;
      }
      return;
    }

    // -- 2. Tombol Forgot Password --
    if (e.target.closest(".forgot-link-new")) {
      e.preventDefault();

      const email = prompt("Enter your email address to reset your password:");
      if (!email) return; // user cancelled

      try {
        await resetPassword(email.trim());
        alert("Password reset email sent! Check your inbox.");
      } catch (err) {
        alert("Failed to send reset email: " + err.message);
      }
      return;
    }

    // -- 3. Tombol Social Login (Google & Apple) --
    const providerBtn = e.target.closest("[data-provider]");
    if (providerBtn) {
      e.preventDefault();
      const provider = providerBtn.getAttribute("data-provider");
      const originalHtml = providerBtn.innerHTML;
      
      providerBtn.innerHTML = "Connecting...";
      providerBtn.style.opacity = "0.7";
      providerBtn.style.pointerEvents = "none";

      try {
        await loginWithProvider(provider);
      } catch (err) {
        if (err.message.includes("not enabled") || err.message.includes("Unsupported provider")) {
          alert(`[INFO] Bos harus mengaktifkan Provider ${provider.toUpperCase()} di Dashboard Supabase -> Authentication -> Providers.`);
        } else {
          alert(`Gagal terhubung: ${err.message}`);
        }
        providerBtn.innerHTML = originalHtml;
        providerBtn.style.opacity = "1";
        providerBtn.style.pointerEvents = "auto";
      }
      return;
    }
  });

  // -- 4. SUBMIT FORM LOGIN & REGISTER --
  document.addEventListener("submit", async (e) => {
    
    // Form Login
    if (e.target.matches("[data-login-form]")) {
      e.preventDefault();
      const form = e.target;
      const btn = form.querySelector(".btn-signin");
      const email = form.querySelector('input[name="email"]').value;
      const password = form.querySelector('input[name="password"]').value;
      const errorMsg = document.getElementById("login-error");
      
      if (btn) { btn.textContent = "Authenticating..."; btn.disabled = true; }
      if (errorMsg) { errorMsg.textContent = ""; }
      
      try {
        await loginUser(email, password);
        document.getElementById("login").hidden = true;
        document.getElementById("app").hidden = false;
        await showApp("home");
      } catch (error) {
        if (errorMsg) errorMsg.textContent = "Error: " + error.message;
        if (btn) { btn.textContent = "Sign In"; btn.disabled = false; }
      }
    }

    // Form Register
    if (e.target.matches("[data-register-form]")) {
      e.preventDefault();
      const form = e.target;
      const btn = form.querySelector(".btn-signin");
      const name = form.querySelector('input[name="name"]').value;
      const email = form.querySelector('input[name="email"]').value;
      const password = form.querySelector('input[name="password"]').value;
      const errorMsg = document.getElementById("register-error");

      if (btn) { btn.textContent = "Creating Account..."; btn.disabled = true; }
      if (errorMsg) { errorMsg.textContent = ""; errorMsg.style.color = "#1c1917"; }

      try {
        await registerUser(email, password, name);
        if (errorMsg) {
          errorMsg.style.color = "#3d5a30"; 
          errorMsg.textContent = "Success! Redirecting...";
        }
        setTimeout(async () => {
          document.getElementById("register").hidden = true;
          document.getElementById("app").hidden = false;
          await showApp("home");
        }, 1000);
      } catch (error) {
        if (errorMsg) {
          errorMsg.style.color = "#dc2626";
          errorMsg.textContent = "Error: " + error.message;
        }
        if (btn) { btn.textContent = "Create Account"; btn.disabled = false; }
      }
    }
  });
}