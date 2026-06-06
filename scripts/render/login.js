// scripts/render/login.js
import { showApp } from "../router.js";
import { loginUser, registerUser, loginWithProvider, resetPassword } from "../auth.js";

let isLoginBound = false;

export function bindLoginPage() {
  if (isLoginBound) return;
  isLoginBound = true;

  // ==========================================
  // 1. NAVIGASI KLIK GLOBAL (Event Delegation)
  // ==========================================
  document.addEventListener("click", async (e) => {
    
    // Pindah menu antara Login <-> Register <-> Forgot Password
    const navBtn = e.target.closest("[data-nav-to]");
    if (navBtn) {
      e.preventDefault();
      const target = navBtn.getAttribute("data-nav-to");
      const sections = { 
        login: document.getElementById("login"), 
        register: document.getElementById("register"), 
        forgot: document.getElementById("forgot") 
      };
      
      // Tutup semua, lalu buka yang dituju
      Object.values(sections).forEach(sec => { if (sec) sec.hidden = true; });
      if (sections[target]) sections[target].hidden = false;
      return;
    }

    // Tombol Lupa Password text link
    if (e.target.closest(".forgot-link-new")) {
      e.preventDefault();
      document.getElementById("login").hidden = true;
      document.getElementById("forgot").hidden = false;
      return;
    }

    // Tombol Login via Google / Apple
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
        alert(`Provider ${provider} error: ${err.message}`);
        providerBtn.innerHTML = originalHtml;
        providerBtn.style.opacity = "1";
        providerBtn.style.pointerEvents = "auto";
      }
      return;
    }
  });

  // ==========================================
  // 2. EKSEKUSI FORM SUBMIT
  // ==========================================
  document.addEventListener("submit", async (e) => {
    
    // --- FORM LOGIN ---
    if (e.target.matches("[data-login-form]")) {
      e.preventDefault();
      const form = e.target;
      const btn = form.querySelector(".btn-signin") || form.querySelector("button[type='submit']");
      const email = form.querySelector('input[name="email"]').value;
      const password = form.querySelector('input[name="password"]').value;
      const errorMsg = document.getElementById("login-error") || form.querySelector(".error-msg");
      
      if (btn) { btn.textContent = "Authenticating..."; btn.disabled = true; }
      if (errorMsg) { errorMsg.textContent = ""; errorMsg.style.color = "#dc2626"; }
      
      try {
        await loginUser(email, password);
        document.getElementById("login").hidden = true;
        document.getElementById("app").hidden = false;
        if (email.length > 100 || password.length > 50) {
            errorMsg.textContent = "Data input terlalu panjang!";
            return;
        }
        
        // Panggil lencana keranjang
        if (window.updateGlobalCartBadge) await window.updateGlobalCartBadge();
        
        const lastRoute = localStorage.getItem('rehome_current_route') || "home";
        await showApp(lastRoute);
      } catch (error) {
        if (errorMsg) errorMsg.textContent = error.message;
        else alert(error.message);
        if (btn) { btn.textContent = "Sign In"; btn.disabled = false; }
      }
    }

    // --- FORM REGISTER ---
    if (e.target.matches("[data-register-form]")) {
      e.preventDefault();
      const form = e.target;
      const btn = form.querySelector(".btn-signin") || form.querySelector("button[type='submit']");
      const name = form.querySelector('input[name="name"]')?.value || "";
      const email = form.querySelector('input[name="email"]').value;
      const password = form.querySelector('input[name="password"]').value;
      const errorMsg = document.getElementById("register-error") || form.querySelector(".error-msg");

      if (btn) { btn.textContent = "Creating Account..."; btn.disabled = true; }
      if (errorMsg) errorMsg.textContent = "";

      try {
        const result = await registerUser(email, password, name);
        
        // Jika butuh konfirmasi email (Supabase Email Confirm = ON)
        if (result && result.needsEmailConfirmation) {
            if (errorMsg) {
                errorMsg.style.color = "#3d5a30"; 
                errorMsg.textContent = "Success! Please check your email to verify your account.";
            }
            setTimeout(() => {
               document.getElementById("register").hidden = true;
               document.getElementById("login").hidden = false;
               form.reset();
               if (btn) { btn.textContent = "Create Account"; btn.disabled = false; }
            }, 3000);
        } else {
            // Jika konfirmasi mati, langsung masuk
            if (errorMsg) { errorMsg.style.color = "#3d5a30"; errorMsg.textContent = "Success! Redirecting..."; }
            setTimeout(async () => {
               document.getElementById("register").hidden = true;
               document.getElementById("app").hidden = false;
               await showApp("home");
            }, 1000);
        }
      } catch (error) {
        if (errorMsg) { errorMsg.style.color = "#dc2626"; errorMsg.textContent = error.message; }
        else alert(error.message);
        if (btn) { btn.textContent = "Create Account"; btn.disabled = false; }
      }
    }

    // --- FORM FORGOT PASSWORD ---
    if (e.target.matches("[data-forgot-form]")) {
      e.preventDefault();
      const form = e.target;
      const btn = form.querySelector(".btn-signin") || form.querySelector("button[type='submit']");
      const email = form.querySelector('input[name="email"]').value;
      const errorMsg = document.getElementById("forgot-error") || form.querySelector(".error-msg");

      if (btn) { btn.textContent = "Sending..."; btn.disabled = true; }
      if (errorMsg) { errorMsg.textContent = ""; }

      try {
        await resetPassword(email);
        if (errorMsg) {
            errorMsg.style.color = "#3d5a30"; 
            errorMsg.textContent = "Reset link sent! Please check your email.";
        }
        if (btn) { btn.textContent = "Send Reset Link"; btn.disabled = false; }
      } catch (error) {
        if (errorMsg) { errorMsg.style.color = "#dc2626"; errorMsg.textContent = error.message; }
        if (btn) { btn.textContent = "Send Reset Link"; btn.disabled = false; }
      }
    }
  });
}