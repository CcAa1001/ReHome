// scripts/auth.js
import { getSupabaseClient, isSupabaseConfigured } from "./supabaseClient.js";
import state from "./state.js";
import { setSession, updateSession } from "./storage.js";

// ── LOGIN ─────────────────────────────────────────────────────────────────────

export async function loginUser(email, password) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) throw error;

  const user = data.user;
  const session = {
    userId: user.id,
    email: user.email,
    name: user.user_metadata?.full_name ?? user.email,
    role: user.user_metadata?.role ?? "buyer"
  };

  setSession(session);
  state.publish("authChanged", session);

  return session;
}

// ── REGISTER ───────────────────Q───────────────────────────────────────────────

// ── REGISTER ──────────────────────────────────────────────────────────────────

export async function registerUser(email, password, name) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name, role: "buyer" }
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
    name,
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
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }
  
  const supabase = await getSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/#reset-password',
  });

  if (error) throw error;
}