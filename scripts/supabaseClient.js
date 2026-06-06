const config = window.REHOME_CONFIG || {};
const supabaseUrl = String(config.supabaseUrl || "").trim();
const supabasePublishableKey = String(config.supabasePublishableKey || "").trim();

let clientPromise;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabasePublishableKey &&
  supabaseUrl.startsWith("https://") &&
  supabasePublishableKey.startsWith("sb_publishable_")
);

export async function getSupabaseClient() {
  if (!isSupabaseConfigured) {
    return null;
  }

  clientPromise ??= import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm")
    .then(({ createClient }) => createClient(supabaseUrl, supabasePublishableKey));

  return clientPromise;
}
