// scripts/app.js
import { elements } from "./dom.js";
import { navigate, showApp } from "./router.js";
import { bindLoginPage } from "./render/login.js";
import { 
  renderAll, 
  renderAccount, 
  renderCart, 
  renderListings, 
  renderProducts, 
  renderSettings 
} from "./render/index.js";
import { bindCartRemoval } from "./render/cart.js";
import { setListingFilter } from "./render/listings.js";
import { setCategoryFilter } from "./render/products.js";
import { addCartItem, exportDatabase, hasSession, resetDatabase, saveSettings, setSession, updateSession } from "./storage.js";
import {
  addRemoteCartItem,
  createRemoteProduct,
  getCurrentUserWithProfile,
  getProducts,
  saveRemoteSettings,
  updateRemoteProfile
} from "./supabaseDatabase.js";
import { showToast } from "./ui.js";

// ── BOOT (Hanya panggil bind saat elemen tersedia) ──────────────────────────

async function boot() {
  bindLoginPage();
  bindRouting();
  bindListingFilters();
  bindCategoryFilters();
  bindCartActions();
  bindPassiveForms();
  bindSettings();
  bindProfile();
  bindUtilityActions();

  // Cek session
  try {
    const supabaseUser = await getCurrentUserWithProfile();
    if (supabaseUser) setSession(supabaseUser);
    
    if (supabaseUser || hasSession()) {
      await showApp("home", renderAll);
    }
  } catch (e) {
    console.error("Boot error:", e);
    if (hasSession()) await showApp("home", renderAll);
  }
}

// ── BINDING FUNCTIONS ──────────────────────────────────────────────────────

function bindRouting() {
  elements.routeButtons.forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.route));
  });
}

function bindListingFilters() {
  elements.filterButtons?.forEach((button) => {
    button.addEventListener("click", () => {
      elements.filterButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      setListingFilter(button.dataset.filter);
      renderListings();
    });
  });
}

function bindCategoryFilters() {
  elements.categoryButtons?.forEach((button) => {
    button.addEventListener("click", async () => {
      elements.categoryButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      setCategoryFilter(button.dataset.category);
      await renderProducts();
    });
  });
}

function bindCartActions() {
  if (elements.addCartButton) {
    elements.addCartButton.addEventListener("click", async () => {
      const products = await getProducts();
      const featured = products[0]; // Ambil produk pertama sebagai contoh
      
      const remoteAdded = await addRemoteCartItem(featured);
      if (!remoteAdded) addCartItem(featured);

      await renderCart();
      showToast(`Added to selection.`);
      navigate("cart");
    });
  }

  bindCartRemoval(async () => {
    await renderCart();
    await renderSettings();
    showToast("Item removed.");
  });
}

function bindPassiveForms() {
  elements.newsletters?.forEach((f) => f.addEventListener("submit", (e) => e.preventDefault()));
}

function bindSettings() {
  elements.settingsForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(elements.settingsForm);
    const settings = { currency: data.get("currency"), theme: data.get("theme") };
    saveSettings(settings);
    await saveRemoteSettings(settings);
    await renderSettings();
    showToast("Settings saved.");
  });
}

function bindProfile() {
  elements.profileForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(elements.profileForm);
    const session = updateSession({ name: data.get("name"), role: data.get("role") });
    await updateRemoteProfile(session);
    renderAccount();
    showToast("Profile saved.");
  });
}

function bindUtilityActions() {
  elements.newListingForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await createRemoteProduct(new FormData(elements.newListingForm));
      await renderProducts();
      showToast("Listing created!");
      navigate("shop");
    } catch (err) { showToast("Error saving listing."); }
  });
}

boot();