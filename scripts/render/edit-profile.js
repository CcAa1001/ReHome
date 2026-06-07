import { getSupabaseClient } from "../supabaseClient.js";
import { navigate } from "../router.js";
import { showToast } from "../ui.js";

function sanitize(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag] || tag));
}

export async function renderEditProfile() {
  const container = document.getElementById("router-view");
  if (!container) return;

  try {
    const supabase = await getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      navigate("home");
      return;
    }

    const avatarImgEl = document.getElementById("edit-avatar-img");
    const initialEl = document.getElementById("edit-initial");
    const uploadInput = document.getElementById("edit-avatar-upload");
    const form = document.getElementById("edit-profile-form");
    const fullnameInput = document.getElementById("edit-fullname");
    const shopnameInput = document.getElementById("edit-shopname");
    const locationInput = document.getElementById("edit-location");
    const descInput = document.getElementById("edit-description");
    const saveBtn = document.getElementById("edit-save-btn");

    let currentAvatarUrl = null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      currentAvatarUrl = profile.avatar_url;
      fullnameInput.value = profile.full_name || '';
      shopnameInput.value = profile.shop_name || '';
      locationInput.value = profile.location || '';
      descInput.value = profile.description || '';

      const displayName = profile.shop_name || profile.full_name || user.user_metadata?.full_name || 'U';

      if (profile.avatar_url && avatarImgEl) {
        avatarImgEl.innerHTML = `<img src="${sanitize(profile.avatar_url)}" style="width:100%; height:100%; object-fit:cover;">`;
      } else if (initialEl) {
        initialEl.textContent = displayName.charAt(0).toUpperCase();
      }
    } else {
      fullnameInput.value = user.user_metadata?.full_name || '';
      if (initialEl) {
        initialEl.textContent = (fullnameInput.value || 'U').charAt(0).toUpperCase();
      }
    }

    if (uploadInput) {
      uploadInput.addEventListener('change', async (e) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        
        showToast("Uploading avatar...");
        const ext = file.name.split('.').pop();
        const path = `${user.id}/avatar_${Date.now()}.${ext}`;
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(path, file, { cacheControl: '3600', upsert: false });
          
        if (uploadError) {
          showToast("Upload failed.");
          return;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(path);
          
        currentAvatarUrl = publicUrl;
        
        if (avatarImgEl) {
          avatarImgEl.innerHTML = `<img src="${sanitize(publicUrl)}" style="width:100%; height:100%; object-fit:cover;">`;
        }
        showToast("Avatar image ready to save!");
      });
    }

    if (form) {
      form.addEventListener('submit', async () => {
        saveBtn.textContent = "Saving...";
        saveBtn.disabled = true;

        const newFullName = fullnameInput.value.trim();
        const newShopName = shopnameInput.value.trim();
        const newLocation = locationInput.value.trim();
        const newDescription = descInput.value.trim();

        const updates = {
          full_name: newFullName,
          shop_name: newShopName,
          location: newLocation,
          description: newDescription,
        };

        if (currentAvatarUrl) {
          updates.avatar_url = currentAvatarUrl;
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);

        if (updateError) {
          showToast("Failed to update profile.");
          saveBtn.textContent = "Save Profile";
          saveBtn.disabled = false;
        } else {
          showToast("Profile Updated!");
          navigate("profile");
        }
      });
    }

  } catch (err) {
    console.error("Error loading edit profile:", err);
  }
}
