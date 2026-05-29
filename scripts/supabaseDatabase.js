// scripts/supabaseDatabase.js
import { products as fallbackProducts } from "./data.js";
import { getSupabaseClient, isSupabaseConfigured } from "./supabaseClient.js";

// ── FORMATTERS ────────────────────────────────────────────────────────────────

function resolveCategory(raw = "") {
  const c = String(raw).toLowerCase();
  if (c.includes("decor"))   return "decor";
  if (c.includes("storage")) return "storage";
  if (c.includes("textile")) return "textiles";
  return "seating";
}

export function formatProduct(row) {
  const price = Number(row.price ?? 0);
  return {
    id:           row.id,
    title:        row.title,
    maker:        row.maker ?? "ReHome",
    category:     resolveCategory(row.category),
    meta:         `${row.condition ?? "Excellent"} - ${row.category ?? "Furniture"}`,
    price:        `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
    rrp:          row.is_featured ? "Curated Selection" : "Authenticated",
    condition:    row.condition ?? "Excellent",
    image:        row.image_url || "assets/figma-export/50c650dc19d53b235c064dcad7dc23f8b08e5668.png",
    alt:          row.title,
    amount:       price,
    carbonOffset: Number(row.carbon_offset ?? 0)
  };
}

function formatCartItem(row) {
  const product = formatProduct(row.products ?? row.product ?? row);
  return {
    ...product,
    remoteCartId: row.id,
    quantity:     Number(row.quantity ?? 1),
    label:        "Sustainably Sourced"
  };
}

// ── INTERNAL HELPERS ──────────────────────────────────────────────────────────

async function getSignedInUser() {
  if (!isSupabaseConfigured) return null;
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

async function getProfile(userId) {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ── AUTH ──────────────────────────────────────────────────────────────────────

export async function signInWithSupabase(email, password) {
  if (!isSupabaseConfigured) return null;
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOutSupabase() {
  if (!isSupabaseConfigured) return;
  const supabase = await getSupabaseClient();
  await supabase.auth.signOut();
}

export async function getCurrentSupabaseUser() {
  try { return await getSignedInUser(); }
  catch { return null; }
}

export async function getCurrentUserWithProfile() {
  try {
    const user = await getSignedInUser();
    if (!user) return null;
    const profile = await getProfile(user.id);
    return {
      ...user,
      name:     profile?.full_name || user.user_metadata?.full_name || user.email,
      role:     profile?.role      || user.user_metadata?.role      || "buyer",
      location: profile?.location  || ""
    };
  } catch (error) {
    console.warn("Supabase profile lookup failed:", error.message);
    return null;
  }
}

// ── PRODUCTS ──────────────────────────────────────────────────────────────────

export async function getProducts() {
  if (!isSupabaseConfigured) return fallbackProducts;
  let response;
  try {
    const supabase = await getSupabaseClient();
    response = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: true });
  } catch (error) {
    console.warn("Supabase client failed, using local fallback:", error.message);
    return fallbackProducts;
  }
  const { data, error } = response;
  if (error) {
    console.warn("Supabase products failed, using local fallback:", error.message);
    return fallbackProducts;
  }
  return data.length ? data.map(formatProduct) : fallbackProducts;
}

async function uploadProductImage(file, userId) {
  if (!file || !file.size) return "";
  const supabase = await getSupabaseClient();
  const safeName = file.name.replace(/[^a-z0-9._-]/gi, "-").toLowerCase();
  const filePath = `${userId}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(filePath, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("product-images").getPublicUrl(filePath);
  return data.publicUrl;
}

export async function createRemoteProduct(formData) {
  try {
    const user = await getSignedInUser();
    if (!user) throw new Error("Please sign in with a Supabase account before creating a listing.");
    const supabase    = await getSupabaseClient();
    const file        = formData.get("imageFile");
    const uploadedImage = await uploadProductImage(file, user.id);
    const imageUrl    = uploadedImage || String(formData.get("imageUrl") ?? "").trim();
    const price       = Number(String(formData.get("price") ?? "").replace(/[^0-9.]/g, "")) || 0;
    const { data, error } = await supabase
      .from("products")
      .insert({
        title:         String(formData.get("title")       ?? "").trim(),
        maker:         String(formData.get("maker")        ?? "Independent Seller").trim(),
        description:   String(formData.get("description") ?? "").trim(),
        category:      String(formData.get("category")    ?? "Furniture").trim(),
        condition:     String(formData.get("condition")   ?? "Excellent").trim(),
        price,
        currency:      "USD",
        image_url:     imageUrl,
        carbon_offset: Number(formData.get("carbonOffset") ?? 1),
        seller_id:     user.id,
        is_featured:   false
      })
      .select()
      .single();
    if (error) throw error;
    return formatProduct(data);
  } catch (error) {
    console.warn("Supabase product insert failed:", error.message);
    throw error;
  }
}

// ── PROFILE ───────────────────────────────────────────────────────────────────

export async function updateRemoteProfile(updates) {
  try {
    const user = await getSignedInUser();
    if (!user) return null;
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({ full_name: updates.name, location: updates.location })
      .eq("id", user.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.warn("Supabase profile update failed:", error.message);
    return null;
  }
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────

export async function getRemoteSettings() {
  try {
    const user = await getSignedInUser();
    if (!user) return null;
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      currency:           data.currency,
      theme:              data.theme,
      emailNotifications: data.email_notifications,
      carbonTracking:     data.carbon_tracking
    };
  } catch (error) {
    console.warn("Supabase settings lookup failed:", error.message);
    return null;
  }
}

export async function saveRemoteSettings(settings) {
  try {
    const user = await getSignedInUser();
    if (!user) return null;
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("user_settings")
      .upsert({
        user_id:             user.id,
        currency:            settings.currency,
        theme:               settings.theme,
        email_notifications: settings.emailNotifications,
        carbon_tracking:     settings.carbonTracking,
        updated_at:          new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.warn("Supabase settings save failed:", error.message);
    return null;
  }
}

// ── CART ──────────────────────────────────────────────────────────────────────

export async function getRemoteCart() {
  try {
    const user = await getSignedInUser();
    if (!user) return null;
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("cart_items")
      .select("id, quantity, products(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data.map(formatCartItem);
  } catch (error) {
    console.warn("Supabase cart lookup failed:", error.message);
    return null;
  }
}

export async function addRemoteCartItem(product) {
  try {
    const user = await getSignedInUser();
    if (!user || !product.id) return false;
    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from("cart_items")
      .upsert(
        { user_id: user.id, product_id: product.id, quantity: 1 },
        { onConflict: "user_id,product_id" }
      );
    if (error) throw error;
    return true;
  } catch (error) {
    console.warn("Supabase cart insert failed:", error.message);
    return false;
  }
}

export async function removeRemoteCartItem(cartItemId) {
  try {
    const user = await getSignedInUser();
    if (!user || !cartItemId) return false;
    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", cartItemId)
      .eq("user_id", user.id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.warn("Supabase cart delete failed:", error.message);
    return false;
  }
}

// ── CHECKOUT ──────────────────────────────────────────────────────────────────

export async function checkoutCart() {
  const user = await getSignedInUser();
  if (!user) throw new Error("Please sign in before checkout.");

  const supabase = await getSupabaseClient();
  const { data: cartRows, error: cartError } = await supabase
    .from("cart_items")
    .select("id, quantity, product_id, products(id, title, price)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (cartError) throw cartError;
  if (!cartRows?.length) throw new Error("Your cart is empty.");

  const subtotal     = cartRows.reduce((sum, r) => sum + Number(r.products?.price ?? 0) * Number(r.quantity ?? 1), 0);
  const offsetCredit = 4.5;
  const total        = subtotal + offsetCredit;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({ user_id: user.id, status: "pending", subtotal, shipping: 0, carbon_credit: 0, total })
    .select()
    .single();
  if (orderError) throw orderError;

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(cartRows.map((r) => ({
      order_id:   order.id,
      product_id: r.product_id,
      title:      r.products?.title ?? "ReHome item",
      quantity:   Number(r.quantity ?? 1),
      price:      Number(r.products?.price ?? 0)
    })));
  if (itemsError) throw itemsError;

  const { error: deleteError } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", user.id)
    .in("id", cartRows.map((r) => r.id));
  if (deleteError) throw deleteError;

  return { ...order, items: cartRows };
}

// ── HISTORY (FUNGSI BARU) ─────────────────────────────────────────────────────

export async function getPurchaseHistory() {
  try {
    const user = await getSignedInUser();
    if (!user) return null;
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("orders")
      .select("id, status, subtotal, total, created_at, order_items(id, title, quantity, price, product_id)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.warn("Purchase history failed:", error.message);
    return null;
  }
}

export async function getSalesHistory() {
  try {
    const user = await getSignedInUser();
    if (!user) return null;
    const supabase = await getSupabaseClient();

    const { data: myProducts, error: pErr } = await supabase
      .from("products")
      .select("id, title, image_url")
      .eq("seller_id", user.id);
    if (pErr) throw pErr;
    if (!myProducts?.length) return [];

    const { data, error } = await supabase
      .from("order_items")
      .select("id, quantity, price, product_id, orders(id, status, created_at, total)")
      .in("product_id", myProducts.map((p) => p.id))
      .order("id", { ascending: false });
    if (error) throw error;

    const productMap = Object.fromEntries(myProducts.map((p) => [p.id, p]));
    return (data ?? []).map((item) => ({ ...item, product: productMap[item.product_id] ?? null }));
  } catch (error) {
    console.warn("Sales history failed:", error.message);
    return null;
  }
}

// scripts/supabaseDatabase.js — tambahkan setelah getSalesHistory()

export async function updateOrderStatus(orderId, status) {
  try {
    const user = await getSignedInUser();
    if (!user || !orderId) return false;

    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.warn("Order status update failed:", error.message);
    return false;
  }
}