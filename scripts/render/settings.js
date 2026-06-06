import { elements } from "../dom.js";
import { getSettings, saveSettings } from "../storage.js";
import { clampInteger } from "../security.js";
import { getSupabaseClient } from "../supabaseClient.js";

const DEFAULT_SETTINGS = {
  currency: "USD",
  theme: "light",
  emailNotifications: true,
  carbonTracking: true
};

async function getRemoteSettings() {
  const supabase = await getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_settings")
    .select("currency, theme, email_notifications, carbon_tracking")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    currency: data.currency || DEFAULT_SETTINGS.currency,
    theme: data.theme || DEFAULT_SETTINGS.theme,
    emailNotifications: Boolean(data.email_notifications),
    carbonTracking: Boolean(data.carbon_tracking)
  };
}

async function getDatabaseStats() {
  const supabase = await getSupabaseClient();
  const [products, cartItems, orders] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("cart_items").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true })
  ]);

  return {
    users: 0,
    cartItems: clampInteger(cartItems.count, 0, 999999, 0),
    historyItems: clampInteger(orders.count, 0, 999999, 0),
    listings: clampInteger(products.count, 0, 999999, 0),
    activeListings: clampInteger(products.count, 0, 999999, 0),
    soldListings: 0
  };
}

export async function renderSettings() {
  const remoteSettings = await getRemoteSettings();
  if (remoteSettings) saveSettings(remoteSettings);

  const settings = { ...DEFAULT_SETTINGS, ...(remoteSettings ?? getSettings()) };
  const stats = await getDatabaseStats();

  if (elements.settingsForm) {
    elements.settingsForm.currency.value = settings.currency;
    elements.settingsForm.theme.value = settings.theme;
    elements.settingsForm.emailNotifications.checked = settings.emailNotifications;
    elements.settingsForm.carbonTracking.checked = settings.carbonTracking;
  }

  if (elements.databaseStats) {
    elements.databaseStats.innerHTML = `
      <div><strong>${stats.users}</strong><span>Users</span></div>
      <div><strong>${stats.cartItems}</strong><span>Cart Items</span></div>
      <div><strong>${stats.historyItems}</strong><span>History Records</span></div>
      <div><strong>${stats.listings}</strong><span>Total Listings</span></div>
      <div><strong>${stats.activeListings}</strong><span>Active</span></div>
      <div><strong>${stats.soldListings}</strong><span>Sold</span></div>
    `;
  }

  document.documentElement.dataset.theme = settings.theme;
}
