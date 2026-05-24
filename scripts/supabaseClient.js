// Paste your Supabase Project URL here.
// Example: https://abcdefghijklmnop.supabase.co
const supabaseUrl = "https://wrwevyhqcitoafmqtzyf.supabase.co";

// Browser-safe publishable key. Never put a secret/service-role key in this file.
const supabasePublishableKey = "sb_publishable_XygYJpObFhGp3yyUT6aGRA_Ybfi91HL";

let clientPromise;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabasePublishableKey &&
  supabaseUrl.startsWith("https://")
);

export async function getSupabaseClient() {
  if (!isSupabaseConfigured) {
    return null;
  }

  clientPromise ??= import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm")
    .then(({ createClient }) => createClient(supabaseUrl, supabasePublishableKey));

  return clientPromise;
}
