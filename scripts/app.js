// scripts/app.js
import { elements }                   from "./dom.js";
import { navigate, showApp }          from "./router.js";
import { bindLoginPage }              from "./render/login.js";
import {
  renderAll,
  renderAccount,
  renderCart,
  renderListings,
  renderSettings
}                                     from "./render/index.js";
import { renderProducts }             from "./render/products.js";
import { bindCartRemoval }            from "./render/cart.js";
import { setListingFilter }           from "./render/listings.js";
import { setCategoryFilter }          from "./render/products.js";
import {
  addCartItem,
  clearSession,
  exportDatabase,
  hasSession,
  resetDatabase,
  saveSettings,
  setSession,
  updateSession
}                                     from "./storage.js";
import {
  addRemoteCartItem,
  createRemoteProduct,
  getCurrentUserWithProfile,
  getProducts,
  saveRemoteSettings,
  signOutSupabase,
  updateRemoteProfile
}                                     from "./supabaseDatabase.js";
import state                          from "./state.js";
import { applyRoleUI }                from "./roles.js";
import { showToast }                  from "./ui.js";

import { bindCheckout } from "./render/checkout.js";

// ── BOOT ──────────────────────────────────────────────────────────────────────

async function boot() {
  bindLoginPage();
  bindCheckout();
  bindRouting();
  bindListingFilters();
  bindCategoryFilters();
  bindCartActions();
  bindStateEvents();
  bindLogout();
  bindPassiveForms();
  bindSettings();
  bindProfile();
  bindUtilityActions();

  try {
    const supabaseUser = await getCurrentUserWithProfile();
    if (supabaseUser) {
      setSession(supabaseUser);
      applyRoleUI();
    }

    if (supabaseUser || hasSession()) {
      await showApp("home", renderAll);
      applyRoleUI();
    }
  } catch (error) {
    console.error("Boot error:", error);
    if (hasSession()) {
      await showApp("home", renderAll);
      applyRoleUI();
    }
  }
}

// ── ROUTING ───────────────────────────────────────────────────────────────────

function bindRouting() {
  elements.routeButtons?.forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.route));
  });
}

// ── FILTERS ───────────────────────────────────────────────────────────────────

function bindListingFilters() {
  elements.filterButtons?.forEach((button) => {
    button.addEventListener("click", () => {
      elements.filterButtons.forEach((b) => b.classList.remove("active"));
      button.classList.add("active");
      setListingFilter(button.dataset.filter);
      renderListings();
    });
  });
}

function bindCategoryFilters() {
  elements.categoryButtons?.forEach((button) => {
    button.addEventListener("click", async () => {
      elements.categoryButtons.forEach((b) => b.classList.remove("active"));
      button.classList.add("active");
      setCategoryFilter(button.dataset.category);
      await renderProducts();
    });
  });
}

// ── CART ──────────────────────────────────────────────────────────────────────

// ── CART ANIMATION ────────────────────────────────────────────────────────────

function triggerCartAnimation() {
  const cartBtn = document.querySelector(".cart-button");
  if (!cartBtn) return;
  cartBtn.classList.remove("cart-pop");
  void cartBtn.offsetWidth; // force reflow agar animasi bisa diulang
  cartBtn.classList.add("cart-pop");
  cartBtn.addEventListener("animationend", () => {
    cartBtn.classList.remove("cart-pop");
  }, { once: true });
}

// ── CART ACTIONS ──────────────────────────────────────────────────────────────

function bindCartActions() {
  if (elements.addCartButton) {
    elements.addCartButton.addEventListener("click", async () => {
      const products = await getProducts();
      const featuredProduct =
        products.find((p) => p.title === "Curated Oak Lounge Chair") ??
        products.find((p) => p.title?.includes("Oak")) ??
        products[0];

      if (!featuredProduct) {
        showToast("No products available.");
        return;
      }

      const remoteAdded = await addRemoteCartItem(featuredProduct);
      if (!remoteAdded) addCartItem(featuredProduct);

      await renderCart();
      showToast(`Added ${featuredProduct.title} to your selection.`);
      triggerCartAnimation(); // ← animasi setelah tambah item
      navigate("cart");
    });
  }

  bindCartRemoval(async () => {
    await renderCart();
    await renderSettings();
    showToast("Item removed from your selection.");
  });
}

// ── GLOBAL STATE ──────────────────────────────────────────────────────────────

function bindStateEvents() {
  state.subscribe("cartUpdated", (cart = []) => {
    const count = Array.isArray(cart) ? cart.length : 0;
    if (elements.cartCount) elements.cartCount.textContent = count;
    if (count > 0) triggerCartAnimation(); // ← animasi saat cart berubah dari mana pun
  });
}


// ── LOGOUT ────────────────────────────────────────────────────────────────────

function bindLogout() {
  elements.logoutButton?.addEventListener("click", async () => {
    elements.logoutButton.disabled = true;

    try {
      await signOutSupabase();
    } catch (error) {
      console.warn("Supabase logout failed:", error.message);
    }

    clearSession();
    state.publish("authChanged", null);
    state.publish("cartUpdated", []);

    elements.app.hidden   = true;
    elements.login.hidden = false;
    applyRoleUI();
    showToast("You have been logged out.");
    elements.logoutButton.disabled = false;
  });
}

// ── PASSIVE FORMS ─────────────────────────────────────────────────────────────

function bindPassiveForms() {
  elements.newsletters?.forEach((f) => {
    f.addEventListener("submit", (e) => e.preventDefault());
  });
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────

function bindSettings() {
  elements.settingsForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form     = new FormData(elements.settingsForm);
    const settings = {
      currency:           String(form.get("currency")),
      theme:              String(form.get("theme")),
      emailNotifications: form.has("emailNotifications"),
      carbonTracking:     form.has("carbonTracking")
    };

    saveSettings(settings);
    await saveRemoteSettings(settings);
    await renderSettings();
    showToast("Settings saved.");
  });

  // Export database JSON
  elements.exportDatabaseButton?.addEventListener("click", () => {
    const blob = new Blob([exportDatabase()], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href     = url;
    link.download = "rehome-database.json";
    link.click();
    URL.revokeObjectURL(url);
    showToast("Database JSON export started.");
  });

  // Reset demo database
  elements.resetDatabaseButton?.addEventListener("click", async () => {
    resetDatabase();
    await renderAll();
    showToast("Demo database reset.");
  });
}

// ── PROFILE ───────────────────────────────────────────────────────────────────

function bindProfile() {
  elements.profileForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form    = new FormData(elements.profileForm);
    const session = updateSession({
      name:     String(form.get("name")).trim()     || "Vivian",
      location: String(form.get("location")).trim() || "Copenhagen, DK",
      role:     String(form.get("role"))
    });

    await updateRemoteProfile(session);
    renderAccount();
    applyRoleUI();
    showToast(`Profile saved. Role: ${session.role}.`);
  });
}

// ── UTILITY ACTIONS ───────────────────────────────────────────────────────────

const ACTION_MESSAGES = {
  "load-more":       "More treasures are queued for the next catalog page.",
  "select-files":    "Image upload will connect to Supabase Storage next.",
  valuation:         "AI valuation demo complete: fair price remains $1,240.",
  "make-offer":      "Offer draft created. Checkout messaging can be added next.",
  "edit-shipping":   "Shipping editor will open when checkout forms are wired.",
  "download-report": "Seller performance report prepared for export."
};

function bindUtilityActions() {
  elements.actionButtons?.forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.action;
      if (action === "submit-listing") return;
      showToast(ACTION_MESSAGES[action] ?? "Action acknowledged.");
    });
  });

  elements.newListingForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const product = await createRemoteProduct(new FormData(elements.newListingForm));
      await renderProducts();
      showToast(`${product.title} was inserted into Supabase products.`);
      navigate("shop");
    } catch (error) {
      showToast(error.message ?? "Listing could not be saved yet.");
    }
  });
}

boot();