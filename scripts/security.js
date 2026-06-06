const MAX_TEXT_LENGTH = 500;
const MAX_URL_LENGTH = 2048;
const SAFE_LOCAL_ASSET = "assets/chair.jpg";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_PREFIX = "rehome.rateLimit.";
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;

export function sanitize(value, fallback = "") {
  if (value === null || value === undefined) return fallback;

  return String(value)
    .slice(0, MAX_TEXT_LENGTH)
    .replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      "\"": "&quot;"
    }[char]));
}

export function sanitizeShortText(value, fallback = "") {
  return sanitize(value, fallback).slice(0, 120);
}

export function sanitizeUrl(value, fallback = SAFE_LOCAL_ASSET) {
  if (!value) return fallback;

  const raw = String(value).trim().slice(0, MAX_URL_LENGTH);
  if (raw.startsWith("assets/") && !raw.includes("..")) return sanitize(raw, fallback);

  try {
    const url = new URL(raw, window.location.origin);
    const allowedProtocol = url.protocol === "https:" || url.protocol === "http:";
    const sameOrigin = url.origin === window.location.origin;

    if (allowedProtocol && (sameOrigin || url.protocol === "https:")) {
      return sanitize(url.href, fallback);
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export function toSafeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function toSafeMoney(value, fallback = 0) {
  return toSafeNumber(value, fallback).toFixed(2);
}

export function isUuid(value) {
  return UUID_PATTERN.test(String(value ?? ""));
}

export function clampInteger(value, min, max, fallback = min) {
  const number = Math.trunc(Number(value));
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(number, min), max);
}

export function normalizeEmail(value) {
  const email = String(value ?? "").trim().toLowerCase();
  if (email.length < 3 || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw new Error("Please enter a valid email address.");
  }
  return email;
}

export function validatePassword(value) {
  const password = String(value ?? "");
  if (password.length < 8 || password.length > 72) {
    throw new Error("Password must be between 8 and 72 characters.");
  }
  return password;
}

export function validateName(value) {
  const name = String(value ?? "").trim();
  if (name.length < 2 || name.length > 120) {
    throw new Error("Name must be between 2 and 120 characters.");
  }
  if (/[<>]/.test(name)) {
    throw new Error("Name contains invalid characters.");
  }
  return name;
}

export function assertLoginAllowed(identifier, now = Date.now()) {
  const key = RATE_LIMIT_PREFIX + normalizeEmail(identifier);
  const attempts = JSON.parse(localStorage.getItem(key) || "[]")
    .filter((timestamp) => now - Number(timestamp) < LOGIN_WINDOW_MS);

  if (attempts.length >= LOGIN_MAX_ATTEMPTS) {
    throw new Error("Too many login attempts. Please wait 15 minutes and try again.");
  }

  return key;
}

export function recordLoginFailure(identifier, now = Date.now()) {
  const key = RATE_LIMIT_PREFIX + normalizeEmail(identifier);
  const attempts = JSON.parse(localStorage.getItem(key) || "[]")
    .filter((timestamp) => now - Number(timestamp) < LOGIN_WINDOW_MS);
  attempts.push(now);
  localStorage.setItem(key, JSON.stringify(attempts));
}

export function clearLoginFailures(identifier) {
  localStorage.removeItem(RATE_LIMIT_PREFIX + normalizeEmail(identifier));
}
