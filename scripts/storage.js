// scripts/storage.js
import { sessionKey } from "./config.js";
import { loadDatabase, updateDatabase } from "./database.js";
import state from "./state.js";

export { loadDatabase, resetDatabase, exportDatabase, getDatabaseStats } from "./database.js";

// ── AUTH ──────────────────────────────────────────────────────────────────────

export function authenticate(email, password) {
  const database = loadDatabase();
  return database.users?.find((u) => u.email === email && u.password === password) ?? null;
}

/**
 * Buat user demo lokal dari email apa pun.
 * Digunakan saat testing agar tidak ada yang tertolak di halaman login.
 */
export function createLocalDemoUser(email, password = "") {
  const demoUser = {
    id:       `demo-${Date.now()}`,
    email,
    name:     email.split("@")[0],
    role:     "buyer",
    password
  };

  updateDatabase((db) => {
    if (!Array.isArray(db.users)) db.users = [];
    const alreadyExists = db.users.some((u) => u.email === email);
    if (!alreadyExists) db.users.push(demoUser);
  });

  return demoUser;
}

// ── SESSION ───────────────────────────────────────────────────────────────────

export function setSession(user) {
  localStorage.setItem(sessionKey, JSON.stringify({
    userId: user.id ?? user.userId,
    name:   user.name ?? user.user_metadata?.full_name ?? user.email ?? "ReHome User",
    email:  user.email,
    role:   user.role ?? user.user_metadata?.role ?? "buyer"
  }));
}

export function hasSession() {
  return Boolean(localStorage.getItem(sessionKey));
}

export function getSession() {
  const stored = localStorage.getItem(sessionKey);
  return stored ? JSON.parse(stored) : null;
}

export function clearSession() {
  localStorage.removeItem(sessionKey);
}

export function updateSession(updates) {
  const session = getSession() ?? {};
  const next    = { ...session, ...updates };
  localStorage.setItem(sessionKey, JSON.stringify(next));
  return next;
}

// ── CART ──────────────────────────────────────────────────────────────────────

export function addCartItem(item) {
  updateDatabase((db) => { db.cart.push(item); });
  state.publish("cartUpdated", loadDatabase().cart);
}

export function removeCartItem(index) {
  updateDatabase((db) => { db.cart.splice(index, 1); });
  state.publish("cartUpdated", loadDatabase().cart);
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────

export function getSettings() {
  return loadDatabase().settings;
}

export function saveSettings(settings) {
  updateDatabase((db) => {
    db.settings = { ...db.settings, ...settings };
  });
}