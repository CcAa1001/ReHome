import test from "node:test";
import assert from "node:assert/strict";

globalThis.window = {
  location: {
    origin: "http://127.0.0.1:4173"
  }
};
globalThis.localStorage = {
  store: new Map(),
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  },
  setItem(key, value) {
    this.store.set(key, String(value));
  },
  removeItem(key) {
    this.store.delete(key);
  },
  clear() {
    this.store.clear();
  }
};

const {
  sanitize,
  sanitizeShortText,
  sanitizeUrl,
  toSafeMoney,
  isUuid,
  clampInteger,
  normalizeEmail,
  validatePassword,
  validateName,
  assertLoginAllowed,
  recordLoginFailure,
  clearLoginFailures
} = await import("../scripts/security.js");

test("sanitize escapes executable HTML characters", () => {
  assert.equal(
    sanitize(`<img src=x onerror="alert('xss')">`),
    "&lt;img src=x onerror=&quot;alert(&#39;xss&#39;)&quot;&gt;"
  );
});

test("sanitizeShortText limits oversized user controlled strings", () => {
  assert.equal(sanitizeShortText("a".repeat(200)).length, 120);
});

test("sanitizeUrl rejects javascript URLs", () => {
  assert.equal(sanitizeUrl("javascript:alert(1)"), "assets/chair.jpg");
});

test("sanitizeUrl allows safe local assets", () => {
  assert.equal(sanitizeUrl("assets/figma-export/chair.png"), "assets/figma-export/chair.png");
});

test("safe numeric helpers reject malformed values", () => {
  assert.equal(toSafeMoney("x"), "0.00");
  assert.equal(clampInteger("999", 1, 10), 10);
});

test("isUuid accepts only UUID-looking ids", () => {
  assert.equal(isUuid("550e8400-e29b-41d4-a716-446655440000"), true);
  assert.equal(isUuid("not-a-uuid"), false);
});

test("auth validators reject malformed or oversized inputs", () => {
  assert.equal(normalizeEmail(" User@Example.COM "), "user@example.com");
  assert.throws(() => normalizeEmail("not-email"), /valid email/);
  assert.throws(() => validatePassword("short"), /between 8 and 72/);
  assert.throws(() => validateName("<script>"), /invalid characters/);
});

test("login rate limiter blocks after 5 failures in 15 minutes", () => {
  localStorage.clear();
  const email = "rate@example.com";

  for (let index = 0; index < 5; index += 1) {
    assert.doesNotThrow(() => assertLoginAllowed(email, 1000));
    recordLoginFailure(email, 1000 + index);
  }

  assert.throws(() => assertLoginAllowed(email, 2000), /Too many login attempts/);
  clearLoginFailures(email);
  assert.doesNotThrow(() => assertLoginAllowed(email, 2000));
});
