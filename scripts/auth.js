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

  // Supabase mungkin butuh konfirmasi email — cek dulu
  const user = data.user;
  if (!user) {
    throw new Error("Check your email to confirm your account.");
  }

  const session = {
    userId: user.id,
    email: user.email,
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

export async function loginWithProvider(provider) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }
  
  const supabase = await getSupabaseClient();
  // Supabase akan otomatis mengarahkan user ke halaman login Google/Apple
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider,
  });

  if (error) throw error;
  return data;
}