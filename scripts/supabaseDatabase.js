import { products as fallbackProducts } from "./data.js";
import { getSupabaseClient, isSupabaseConfigured } from "./supabaseClient.js";

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
    id:          row.id,
    title:       row.title,
    maker:       row.maker ?? "ReHome",
    category:    resolveCategory(row.category),       // ← bersih
    meta:        `${row.condition ?? "Excellent"} - ${row.category ?? "Furniture"}`,
    price:       `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
    rrp:         row.is_featured ? "Curated Selection" : "Authenticated",
    condition:   row.condition ?? "Excellent",
    image:       row.image_url || "assets/figma-export/50c650dc19d53b235c064dcad7dc23f8b08e5668.png",
    alt:         row.title,
    amount:      price,
    carbonOffset: Number(row.carbon_offset ?? 0)
  };
}


export function formatProduct(row) {
  const price = Number(row.price ?? 0);

  return {
    id: row.id,
    title: row.title,
    maker: row.maker ?? "ReHome",

    category: resolveCategory(row.category),

    meta: `${row.condition ?? "Excellent"} - ${row.category ?? "Furniture"}`,
    price: `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
    rrp: row.is_featured ? "Curated Selection" : "Authenticated",
    condition: row.condition ?? "Excellent",
    image: row.image_url || "assets/figma-export/50c650dc19d53b235c064dcad7dc23f8b08e5668.png",
    alt: row.title,
    amount: price,
    carbonOffset: Number(row.carbon_offset ?? 0)
  };
}

function formatCartItem(row) {
  const product = formatProduct(row.products ?? row.product ?? row);

  return {
    ...product,
    remoteCartId: row.id,
    quantity: Number(row.quantity ?? 1),
    label: "Sustainably Sourced"
  };
}

async function getSignedInUser() {
  if (!isSupabaseConfigured) {
    return null;
  }

  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return null;
  }

  return data.user;
}

async function getProfile(userId) {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getProducts() {
  if (!isSupabaseConfigured) {
    return fallbackProducts;
  }

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

export async function signInWithSupabase(email, password) {
  if (!isSupabaseConfigured) {
    return null;
  }

  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw error;
  }

  return data.user;
}

export async function getCurrentSupabaseUser() {
  try {
    return await getSignedInUser();
  } catch {
    return null;
  }
}

export async function getCurrentUserWithProfile() {
  try {
    const user = await getSignedInUser();
    if (!user) {
      return null;
    }

    const profile = await getProfile(user.id);
    return {
      ...user,
      name: profile?.full_name || user.user_metadata?.full_name || user.email,
      role: profile?.role || user.user_metadata?.role || "buyer",
      location: profile?.location || ""
    };
  } catch (error) {
    console.warn("Supabase profile lookup failed:", error.message);
    return null;
  }
}

export async function updateRemoteProfile(updates) {
  try {
    const user = await getSignedInUser();
    if (!user) {
      return null;
    }

    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: updates.name,
        location: updates.location
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.warn("Supabase profile update failed:", error.message);
    return null;
  }
}

export async function getRemoteSettings() {
  try {
    const user = await getSignedInUser();
    if (!user) {
      return null;
    }

    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      currency: data.currency,
      theme: data.theme,
      emailNotifications: data.email_notifications,
      carbonTracking: data.carbon_tracking
    };
  } catch (error) {
    console.warn("Supabase settings lookup failed:", error.message);
    return null;
  }
}

export async function saveRemoteSettings(settings) {
  try {
    const user = await getSignedInUser();
    if (!user) {
      return null;
    }

    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("user_settings")
      .upsert({
        user_id: user.id,
        currency: settings.currency,
        theme: settings.theme,
        email_notifications: settings.emailNotifications,
        carbon_tracking: settings.carbonTracking,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.warn("Supabase settings save failed:", error.message);
    return null;
  }
}

export async function getRemoteCart() {
  try {
    const user = await getSignedInUser();
    if (!user) {
      return null;
    }

    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("cart_items")
      .select("id, quantity, products(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return data.map(formatCartItem);
  } catch (error) {
    console.warn("Supabase cart lookup failed:", error.message);
    return null;
  }
}

export async function addRemoteCartItem(product) {
  try {
    const user = await getSignedInUser();
    if (!user || !product.id) {
      return false;
    }

    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from("cart_items")
      .upsert({
        user_id: user.id,
        product_id: product.id,
        quantity: 1
      }, { onConflict: "user_id,product_id" });

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.warn("Supabase cart insert failed:", error.message);
    return false;
  }
}

export async function removeRemoteCartItem(cartItemId) {
  try {
    const user = await getSignedInUser();
    if (!user || !cartItemId) {
      return false;
    }

    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", cartItemId)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.warn("Supabase cart delete failed:", error.message);
    return false;
  }
}

async function uploadProductImage(file, userId) {
  if (!file || !file.size) {
    return "";
  }

  const supabase = await getSupabaseClient();
  const safeName = file.name.replace(/[^a-z0-9._-]/gi, "-").toLowerCase();
  const filePath = `${userId}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(filePath, file, { upsert: false });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from("product-images").getPublicUrl(filePath);
  return data.publicUrl;
}

export async function createRemoteProduct(formData) {
  try {
    const user = await getSignedInUser();
    if (!user) {
      throw new Error("Please sign in with a Supabase account before creating a listing.");
    }

    const supabase = await getSupabaseClient();
    const file = formData.get("imageFile");
    const uploadedImage = await uploadProductImage(file, user.id);
    const imageUrl = uploadedImage || String(formData.get("imageUrl") ?? "").trim();
    const price = Number(String(formData.get("price") ?? "").replace(/[^0-9.]/g, "")) || 0;

    const { data, error } = await supabase
      .from("products")
      .insert({
        title: String(formData.get("title") ?? "").trim(),
        maker: String(formData.get("maker") ?? "Independent Seller").trim(),
        description: String(formData.get("description") ?? "").trim(),
        category: String(formData.get("category") ?? "Furniture").trim(),
        condition: String(formData.get("condition") ?? "Excellent").trim(),
        price,
        currency: "USD",
        image_url: imageUrl,
        carbon_offset: Number(formData.get("carbonOffset") ?? 1),
        seller_id: user.id,
        is_featured: false
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return formatProduct(data);
  } catch (error) {
    console.warn("Supabase product insert failed:", error.message);
    throw error;
  }
}
