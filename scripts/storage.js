import { sessionKey } from "./config.js";
import { loadDatabase, updateDatabase } from "./database.js";

export { loadDatabase, resetDatabase, exportDatabase, getDatabaseStats } from "./database.js";

export function authenticate(email, password) {
  const database = loadDatabase();
  return database.users.find((user) => user.email === email && user.password === password);
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
  const nextSession = { ...session, ...updates };
  localStorage.setItem(sessionKey, JSON.stringify(nextSession));
  return nextSession;
}

export function addCartItem(item) {
  updateDatabase((database) => {
    database.cart.push(item);
  });
}

export function removeCartItem(index) {
  updateDatabase((database) => {
    database.cart.splice(index, 1);
  });
}

export function getSettings() {
  return loadDatabase().settings;
}

export function saveSettings(settings) {
  updateDatabase((database) => {
    database.settings = {
      ...database.settings,
      ...settings
    };
  });
}
