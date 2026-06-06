// scripts/auth.js
import { getSupabaseClient, isSupabaseConfigured } from "./supabaseClient.js";
import state from "./state.js";
import { setSession } from "./storage.js";
import {
  assertLoginAllowed,
  clearLoginFailures,
  normalizeEmail,
  recordLoginFailure,
  sanitizeShortText,
  validateName,
  validatePassword
} from "./security.js";

// ── LOGIN ─────────────────────────────────────────────────────────────────────

export async function loginUser(email, password) {
  const safeEmail = normalizeEmail(email);
  const safePassword = validatePassword(password);
  assertLoginAllowed(safeEmail);

  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: safeEmail,
    password: safePassword
  });

  if (error) {
    recordLoginFailure(safeEmail);
    throw error;
  }

  const user = data.user;
  const session = {
    userId: user.id,
    email: user.email,
    name: sanitizeShortText(user.user_metadata?.full_name ?? user.email),
    role: sanitizeShortText(user.user_metadata?.role ?? "buyer")
  };

  clearLoginFailures(safeEmail);
  setSession(session);
  state.publish("authChanged", session);

  return session;
}

// ── REGISTER ───────────────────Q───────────────────────────────────────────────

// ── REGISTER ──────────────────────────────────────────────────────────────────

export async function registerUser(email, password, name) {
  const safeEmail = normalizeEmail(email);
  const safePassword = validatePassword(password);
  const safeName = validateName(name);

  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email: safeEmail,
    password: safePassword,
    options: {
      data: { full_name: safeName, role: "buyer" }
    }
  });

  if (error) throw error;

  // Jika Supabase meminta konfirmasi email, "data.session" akan kosong (null)
  if (!data.session) {
    return { needsEmailConfirmation: true };
  }

  // Jika fitur konfirmasi email dimatikan (langsung login otomatis)
  const session = {
    userId: data.user.id,
    email: data.user.email,
    name: safeName,
    role: "buyer"
  };

  setSession(session);
  state.publish("authChanged", session);

  return session;
}

// ── LOGOUT ────────────────────────────────────────────────────────────────────

export async function logoutUser() {
  if (isSupabaseConfigured) {
    const supabase = await getSupabaseClient();
    await supabase.auth.signOut();
  }

  localStorage.clear();
  state.publish("authChanged", null);
}

// ── SOCIAL LOGIN (OAUTH) ──────────────────────────────────────────────────────

// --- LOGIN DENGAN GOOGLE / APPLE ---
export async function loginWithProvider(provider) {
  const allowedProviders = new Set(["google", "apple"]);
  if (!allowedProviders.has(provider)) throw new Error("Unsupported provider.");
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");

  const supabase = await getSupabaseClient();
  
  // Ambil URL bersih tanpa tanda '#' apapun di belakangnya
  // Ini akan menghasilkan: https://ccaa1001.github.io/ReHome/ 
  const cleanUrl = window.location.origin + window.location.pathname;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: cleanUrl
    }
  });

  if (error) throw error;
  return data;
}

// ── RESET PASSWORD ────────────────────────────────────────────────────────────

export async function resetPassword(email) {
  const safeEmail = normalizeEmail(email);

  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }
  
  const supabase = await getSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(safeEmail, {
    redirectTo: window.location.origin + '/#reset-password',
  });

  if (error) throw error;
}
