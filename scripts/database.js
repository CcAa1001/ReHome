import { databaseKey } from "./config.js";
import { seedDatabase } from "./data.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function moneyToNumber(value) {
  return Number(String(value).replace(/[^0-9.]/g, "")) || 0;
}

function normalizeCartItem(item, index) {
  const seedItem = seedDatabase.cart[index] ?? {};
  return {
    ...seedItem,
    ...item,
    amount: Number(item.amount ?? seedItem.amount ?? moneyToNumber(item.price)),
    carbonOffset: Number(item.carbonOffset ?? seedItem.carbonOffset ?? 1)
  };
}

function normalizeDatabase(database) {
  const cart = Array.isArray(database.cart)
    ? database.cart.map(normalizeCartItem)
    : clone(seedDatabase.cart);

  return {
    ...clone(seedDatabase),
    ...database,
    cart,
    settings: {
      ...seedDatabase.settings,
      ...(database.settings ?? {})
    }
  };
}

export function loadDatabase() {
  const stored = localStorage.getItem(databaseKey);
  if (!stored) {
    const database = clone(seedDatabase);
    saveDatabase(database);
    return database;
  }

  try {
    const database = normalizeDatabase(JSON.parse(stored));
    saveDatabase(database);
    return database;
  } catch {
    return resetDatabase();
  }
}

export function saveDatabase(database) {
  localStorage.setItem(databaseKey, JSON.stringify(database));
}

export function updateDatabase(updater) {
  const database = loadDatabase();
  const nextDatabase = updater(database) ?? database;
  saveDatabase(nextDatabase);
  return nextDatabase;
}

export function resetDatabase() {
  const database = clone(seedDatabase);
  saveDatabase(database);
  return database;
}

export function exportDatabase() {
  return JSON.stringify(loadDatabase(), null, 2);
}

export function getDatabaseStats() {
  const database = loadDatabase();
  return {
    users: database.users.length,
    cartItems: database.cart.length,
    historyItems: database.history.length,
    listings: database.listings.length,
    activeListings: database.listings.filter((listing) => listing.status === "active").length,
    soldListings: database.listings.filter((listing) => listing.status === "sold").length
  };
}
