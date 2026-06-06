import { sessionKey } from "./config.js";
import state from "./state.js";


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

const CART_KEY = "rehome.cart";

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}

export function addCartItem(item) {
  const cart = getCart();
  cart.push(item);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  state.publish("cartUpdated", cart);
}

export function removeCartItem(index) {
  const cart = getCart();
  cart.splice(index, 1);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  state.publish("cartUpdated", cart);
}

const SETTINGS_KEY = "rehome.settings";

export function getSettings() {
  return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
}

export function saveSettings(settings) {
  const current = getSettings();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
}