// scripts/render/login.js
import { showApp } from "../router.js";
import { loginUser, registerUser, loginWithProvider } from "../auth.js";

export function bindLoginPage() {
  const loginSection = document.getElementById("login");
  const registerSection = document.getElementById("register");
  
  const loginForm = document.querySelector("[data-login-form]");
  const registerForm = document.querySelector("[data-register-form]");
  
  const toRegisterBtn = document.querySelector("[data-nav-to='register']");
  const toLoginBtn = document.querySelector("[data-nav-to='login']");

  const loginError = document.getElementById("login-error");
  const registerError = document.getElementById("register-error");

  // 1. Logika Navigasi Pindah Halaman (Login <-> Register)
  if (toRegisterBtn) {
    toRegisterBtn.addEventListener("click", () => {
      loginSection.hidden = true;
      registerSection.hidden = false;
    });
  }

  if (toLoginBtn) {
    toLoginBtn.addEventListener("click", () => {
      registerSection.hidden = true;
      loginSection.hidden = false;
    });
  }

  // 2. Logika Submit Login Manual
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = loginForm.querySelector(".btn-signin");
      const email = loginForm.querySelector('input[name="email"]').value;
      const password = loginForm.querySelector('input[name="password"]').value;
      
      btn.disabled = true;
      loginError.textContent = "Processing...";
      loginError.style.color = "#1c1917";
      
      try {
        await loginUser(email, password);
        loginError.textContent = "";
        loginSection.hidden = true;
        document.getElementById("app").hidden = false;
        await showApp("home");
      } catch (error) {
        loginError.textContent = error.message;
        loginError.style.color = "#dc2626";
      } finally {
        btn.disabled = false;
      }
    });
  }

  // 3. Logika Submit Register Manual
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = registerForm.querySelector(".btn-signin");
      const name = registerForm.querySelector('input[name="name"]').value;
      const email = registerForm.querySelector('input[name="email"]').value;
      const password = registerForm.querySelector('input[name="password"]').value;

      btn.disabled = true;
      registerError.textContent = "Creating account...";
      registerError.style.color = "#1c1917";

      try {
        await registerUser(email, password, name);
        registerError.textContent = "Berhasil! Masuk ke aplikasi...";
        registerError.style.color = "#3d5a30";
        
        setTimeout(async () => {
           registerSection.hidden = true;
           document.getElementById("app").hidden = false;
           await showApp("home");
        }, 1000);
      } catch (error) {
        registerError.textContent = error.message;
        registerError.style.color = "#dc2626";
      } finally {
        btn.disabled = false;
      }
    });
  }

  // 4. Logika Social Login (Google & Apple)
  document.querySelectorAll("[data-provider]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const provider = btn.dataset.provider;
      try {
        // Supabase akan melakukan redirect ke halaman provider (misal Google)
        await loginWithProvider(provider);
      } catch (err) {
        alert(`Gagal terhubung dengan ${provider}: ${err.message}`);
      }
    });
  });
}