// scripts/render/login.js
import { showApp } from "../router.js";
import { loginUser, registerUser, loginWithProvider, resetPassword } from "../auth.js";

// Mencegah event listener ganda
let isLoginBound = false;

export function bindLoginPage() {
  if (isLoginBound) return;
  isLoginBound = true;

  document.addEventListener("click", async (e) => {
    
    // -- 1. Navigasi Pindah Layar (Login <-> Register <-> Forgot) --
    const navBtn = e.target.closest("[data-nav-to]");
    if (navBtn) {
      e.preventDefault();
      const target = navBtn.getAttribute("data-nav-to");
      
      const sections = {
        login: document.getElementById("login"),
        register: document.getElementById("register"),
        forgot: document.getElementById("forgot")
      };

      // Sembunyikan semua
      Object.values(sections).forEach(sec => { if (sec) sec.hidden = true; });
      // Tampilkan yang dituju
      if (sections[target]) sections[target].hidden = false;
      return;
    }

    // -- 2. Tombol Forgot Password (dari halaman Login) --
    if (e.target.closest(".forgot-link-new")) {
      e.preventDefault();
      document.getElementById("login").hidden = true;
      document.getElementById("forgot").hidden = false;
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
          alert(`[INFO] Provider ${provider.toUpperCase()} belum aktif di Dashboard Supabase.`);
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

  // -- 4. SUBMIT FORM LOGIN, REGISTER, & FORGOT --
  document.addEventListener("submit", async (e) => {
    
    // ==========================================
    // FORM LOGIN
    // ==========================================
    if (e.target.matches("[data-login-form]")) {
      e.preventDefault();
      const form = e.target;
      const btn = form.querySelector(".btn-signin");
      const email = form.querySelector('input[name="email"]').value;
      const password = form.querySelector('input[name="password"]').value;
      const errorMsg = document.getElementById("login-error");
      
      if (btn) { btn.textContent = "Authenticating..."; btn.disabled = true; }
      if (errorMsg) { errorMsg.textContent = ""; errorMsg.style.color = "#dc2626"; }
      
      try {
        await loginUser(email, password);
        document.getElementById("login").hidden = true;
        document.getElementById("app").hidden = false;
        
        // Cek rute terakhir, jangan selalu balik ke home
        const lastRoute = localStorage.getItem('rehome_current_route') || "home";
        await showApp(lastRoute);
      } catch (error) {
        if (errorMsg) errorMsg.textContent = error.message;
        if (btn) { btn.textContent = "Sign In"; btn.disabled = false; }
      }
    }

    // ==========================================
    // FORM REGISTER (UPDATE UNTUK CONFIRM EMAIL)
    // ==========================================
    if (e.target.matches("[data-register-form]")) {
      e.preventDefault();
      const form = e.target;
      const btn = form.querySelector(".btn-signin");
      const name = form.querySelector('input[name="name"]').value;
      const email = form.querySelector('input[name="email"]').value;
      const password = form.querySelector('input[name="password"]').value;
      const errorMsg = document.getElementById("register-error");

      if (btn) { btn.textContent = "Creating Account..."; btn.disabled = true; }
      if (errorMsg) { errorMsg.textContent = ""; }

      try {
        const result = await registerUser(email, password, name);
        
        if (result && result.needsEmailConfirmation) {
            // Skenario 1: Supabase Meminta Konfirmasi Email
            if (errorMsg) {
                errorMsg.style.color = "#3d5a30"; 
                errorMsg.textContent = "Success! Please check your email to verify your account.";
            }
            
            // Tunggu 3 detik agar user bisa membaca pesan, lalu kembalikan ke layar login
            setTimeout(() => {
               document.getElementById("register").hidden = true;
               document.getElementById("login").hidden = false;
               
               form.reset();
               if (btn) { btn.textContent = "Create Account"; btn.disabled = false; }
               
               // Beri pesan manis di layar login
               const loginErrorMsg = document.getElementById("login-error");
               if (loginErrorMsg) {
                   loginErrorMsg.style.color = "#3d5a30";
                   loginErrorMsg.textContent = "Account created! Please log in after confirming your email.";
               }
            }, 3000);

        } else {
            // Skenario 2: (Cadangan) Jika Confirm Email dimatikan, langsung masuk aplikasi
            if (errorMsg) {
                errorMsg.style.color = "#3d5a30"; 
                errorMsg.textContent = "Success! Redirecting...";
            }
            setTimeout(async () => {
               document.getElementById("register").hidden = true;
               document.getElementById("app").hidden = false;
               await showApp("home");
            }, 1000);
        }
      } catch (error) {
        if (errorMsg) {
            errorMsg.style.color = "#dc2626";
            errorMsg.textContent = error.message;
        }
        if (btn) { btn.textContent = "Create Account"; btn.disabled = false; }
      }
    }

    // ==========================================
    // FORM FORGOT PASSWORD
    // ==========================================
    if (e.target.matches("[data-forgot-form]")) {
      e.preventDefault();
      const form = e.target;
      const btn = form.querySelector(".btn-signin");
      const email = form.querySelector('input[name="email"]').value;
      const errorMsg = document.getElementById("forgot-error");

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
        if (errorMsg) {
            errorMsg.style.color = "#dc2626";
            errorMsg.textContent = error.message;
        }
        if (btn) { btn.textContent = "Send Reset Link"; btn.disabled = false; }
      }
    }
  });
}