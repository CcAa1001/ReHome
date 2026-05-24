// scripts/storage.js
import { sessionKey } from "./config.js";
import { loadDatabase, updateDatabase } from "./database.js";
import state from "./state.js"; // ← tambahkan ini

export { loadDatabase, resetDatabase, exportDatabase, getDatabaseStats } from "./database.js";

export function authenticate(email, password) {
  const database = loadDatabase();
  return database.users.find((u) => u.email === email && u.password === password);
}

export function setSession(user) {
  localStorage.setItem(sessionKey, JSON.stringify({
    userId: user.id,
    name: user.name ?? user.user_metadata?.full_name ?? user.email ?? "ReHome User",
    email: user.email,
    role: user.role ?? user.user_metadata?.role ?? "buyer"
  }));
}

export function hasSession() {
  return Boolean(localStorage.getItem(sessionKey));
}

export function getSession() {
  const stored = localStorage.getItem(sessionKey);
  return stored ? JSON.parse(stored) : null;
}

export function updateSession(updates) {
  const session = getSession() ?? {};
  const next = { ...session, ...updates };
  localStorage.setItem(sessionKey, JSON.stringify(next));
  return next;
}

export function addCartItem(item) {
  updateDatabase((db) => { db.cart.push(item); });

  // ← Beritahu seluruh app bahwa cart berubah
  state.publish("cartUpdated", loadDatabase().cart);
}

export function removeCartItem(index) {
  updateDatabase((db) => { db.cart.splice(index, 1); });

  // ← Beritahu seluruh app bahwa cart berubah
  state.publish("cartUpdated", loadDatabase().cart);
}

export function getSettings() {
  return loadDatabase().settings;
}

export function saveSettings(settings) {
  updateDatabase((db) => {
    db.settings = { ...db.settings, ...settings };
  });
}