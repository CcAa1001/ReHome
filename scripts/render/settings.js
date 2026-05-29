import { elements } from "../dom.js";
import { getDatabaseStats, getSettings, saveSettings } from "../storage.js";
import { getRemoteSettings } from "../supabaseDatabase.js";

export async function renderSettings() {
  const remoteSettings = await getRemoteSettings();
  if (remoteSettings) {
    saveSettings(remoteSettings);
  }

  const settings = remoteSettings ?? getSettings();
  const stats = getDatabaseStats();

  elements.settingsForm.currency.value = settings.currency;
  elements.settingsForm.theme.value = settings.theme;
  elements.settingsForm.emailNotifications.checked = settings.emailNotifications;
  elements.settingsForm.carbonTracking.checked = settings.carbonTracking;

  elements.databaseStats.innerHTML = `
    <div><strong>${stats.users}</strong><span>Users</span></div>
    <div><strong>${stats.cartItems}</strong><span>Cart Items</span></div>
    <div><strong>${stats.historyItems}</strong><span>History Records</span></div>
    <div><strong>${stats.listings}</strong><span>Total Listings</span></div>
    <div><strong>${stats.activeListings}</strong><span>Active</span></div>
    <div><strong>${stats.soldListings}</strong><span>Sold</span></div>
  `;

  document.documentElement.dataset.theme = settings.theme;
}
