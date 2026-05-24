import { elements } from "./dom.js?v=20260524-database4";
import { navigate, showApp } from "./router.js";
import { bindCartRemoval, renderAccount, renderAll, renderCart, renderListings, renderSettings } from "./render/index.js?v=20260524-database4";
import { setListingFilter } from "./render/listings.js";
import { renderProducts } from "./render/products.js?v=20260524-database4";
import { setCategoryFilter } from "./render/products.js?v=20260524-database4";
import { addCartItem, authenticate, exportDatabase, hasSession, resetDatabase, saveSettings, setSession, updateSession } from "./storage.js";
import {
  addRemoteCartItem,
  createRemoteProduct,
  getCurrentUserWithProfile,
  getProducts,
  saveRemoteSettings,
  signInWithSupabase,
  updateRemoteProfile
} from "./supabaseDatabase.js?v=20260524-database4";
import { showToast } from "./ui.js";

async function handleLogin(event) {
  event.preventDefault();

  const data = new FormData(elements.loginForm);
  const email = String(data.get("email")).trim().toLowerCase();
  const password = String(data.get("password"));
  let user;
  let supabaseError;

  try {
    user = await signInWithSupabase(email, password);
  } catch (error) {
    supabaseError = error;
  }

  if (user) {
    user = await getCurrentUserWithProfile() ?? user;
  } else {
    user = authenticate(email, password);
  }

  if (!user) {
    elements.formMessage.textContent = supabaseError?.message ?? "Email atau password belum cocok.";
    return;
  }

  setSession(user);
  elements.formMessage.textContent = "";
  await showApp("home", renderAll);
}

function bindRouting() {
  elements.routeButtons.forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.route));
  });
}

function bindListingFilters() {
  elements.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      elements.filterButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      setListingFilter(button.dataset.filter);
      renderListings();
    });
  });
}

function bindCategoryFilters() {
  elements.categoryButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      elements.categoryButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      setCategoryFilter(button.dataset.category);
      await renderProducts();
    });
  });
}

function bindCartActions() {
  elements.addCartButton.addEventListener("click", async () => {
    const products = await getProducts();
    const featuredProduct = products.find((product) => product.title === "Curated Oak Lounge Chair")
      ?? products.find((product) => product.title.includes("Oak"))
      ?? {
      title: "Curated Oak Lounge Chair",
      label: "Sustainably Sourced",
      meta: "Excellent pre-owned condition",
      price: "$1,240.00",
      amount: 1240,
      carbonOffset: 4,
      image: "assets/figma-export/50c650dc19d53b235c064dcad7dc23f8b08e5668.png"
    };

    const remoteAdded = await addRemoteCartItem(featuredProduct);
    if (!remoteAdded) {
      addCartItem(featuredProduct);
    }

    await renderCart();
    showToast(`Added ${featuredProduct.title} to your selection.`);
    navigate("cart");
  });

  bindCartRemoval(async () => {
    await renderCart();
    await renderSettings();
    showToast("Item removed from your selection.");
  });
}

function bindPassiveForms() {
  elements.newsletters.forEach((newsletter) => {
    newsletter.addEventListener("submit", (event) => event.preventDefault());
  });
}

function bindSettings() {
  elements.settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(elements.settingsForm);
    const settings = {
      currency: String(form.get("currency")),
      theme: String(form.get("theme")),
      emailNotifications: form.has("emailNotifications"),
      carbonTracking: form.has("carbonTracking")
    };

    saveSettings(settings);
    await saveRemoteSettings(settings);
    await renderSettings();
    showToast("Settings saved.");
  });

  elements.exportDatabaseButton.addEventListener("click", () => {
    const databaseJson = exportDatabase();
    const blob = new Blob([databaseJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "rehome-database.json";
    link.click();
    URL.revokeObjectURL(url);
    showToast("Database JSON export started.");
  });

  elements.resetDatabaseButton.addEventListener("click", async () => {
    resetDatabase();
    await renderAll();
    showToast("Demo database reset.");
  });
}

function bindProfile() {
  elements.profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(elements.profileForm);
    const session = updateSession({
      name: String(form.get("name")).trim() || "Vivian",
      location: String(form.get("location")).trim() || "Copenhagen, DK",
      role: String(form.get("role"))
    });

    await updateRemoteProfile(session);
    renderAccount();
    showToast(`Profile saved. Current demo role: ${session.role}.`);
  });
}

function bindUtilityActions() {
  elements.actionButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.action;
      if (action === "submit-listing") {
        return;
      }

      const messages = {
        "load-more": "More treasures are queued for the next catalog page.",
        "select-files": "Image upload will connect to Supabase Storage next.",
        valuation: "AI valuation demo complete: fair price remains $1,240.",
        "make-offer": "Offer draft created. Checkout messaging can be added next.",
        "edit-shipping": "Shipping editor will open when checkout forms are wired.",
        "download-report": "Seller performance report prepared for export."
      };

      showToast(messages[action] ?? "Action acknowledged.");
    });
  });

  elements.newListingForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

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

async function boot() {
  elements.loginForm.addEventListener("submit", handleLogin);
  bindRouting();
  bindListingFilters();
  bindCategoryFilters();
  bindCartActions();
  bindPassiveForms();
  bindSettings();
  bindProfile();
  bindUtilityActions();

  const supabaseUser = await getCurrentUserWithProfile();
  if (supabaseUser) {
    setSession(supabaseUser);
  }

  if (supabaseUser || hasSession()) {
    await showApp("home", renderAll);
  }
}

boot();
