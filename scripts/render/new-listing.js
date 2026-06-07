// scripts/render/new-listing.js — Create New Listing form, connected to Supabase
import { getSupabaseClient } from "../supabaseClient.js";
import { navigate } from "../router.js";
import { showToast } from "../ui.js";

export async function renderNewListing() {
  const container = document.getElementById("router-view");
  if (!container) return;

  const supabase = await getSupabaseClient();
  if (!supabase) { showToast("Database not connected."); return; }

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) { navigate("home"); return; }

  // ─── Bind file upload ───
  const uploadArea = document.getElementById('nl-upload-area');
  const fileInput = document.getElementById('nl-file-input');
  const previewContainer = document.getElementById('nl-preview-row');
  let selectedFile = null;

  if (uploadArea && fileInput) {
    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#3d5a30';
      uploadArea.style.background = '#f0f4ea';
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = '#c8c6c0';
      uploadArea.style.background = '#f5f4f1';
    });
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#c8c6c0';
      uploadArea.style.background = '#f5f4f1';
      if (e.dataTransfer.files.length > 0) {
        selectedFile = e.dataTransfer.files[0];
        showPreview(selectedFile);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        selectedFile = e.target.files[0];
        showPreview(selectedFile);
      }
    });
  }

  function showPreview(file) {
    if (!previewContainer) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewContainer.innerHTML = `
        <div style="position: relative; display: inline-block;">
          <img src="${e.target.result}" style="max-width: 100%; max-height: 200px; border-radius: 12px; object-fit: cover;">
          <button id="nl-remove-img" style="position: absolute; top: 8px; right: 8px; width: 28px; height: 28px; border-radius: 50%; background: rgba(0,0,0,0.6); color: white; border: none; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">&times;</button>
        </div>`;
      previewContainer.style.display = 'block';
      if (uploadArea) uploadArea.style.display = 'none';

      document.getElementById('nl-remove-img')?.addEventListener('click', () => {
        selectedFile = null;
        previewContainer.innerHTML = '';
        previewContainer.style.display = 'none';
        if (uploadArea) uploadArea.style.display = 'block';
        fileInput.value = '';
      });
    };
    reader.readAsDataURL(file);
  }

  // ─── Upload image to Supabase Storage ───
  async function uploadImage(file) {
    if (!file) return null;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('product-images')
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(path);
    return publicUrl;
  }

  // ─── Save listing ───
  async function saveListing(status) {
    const form = document.getElementById('new-listing-form');
    if (!form) return;

    const fd = new FormData(form);
    const title = fd.get('title')?.trim();
    const price = parseFloat(fd.get('price'));

    if (!title || title.length < 2) {
      showToast("Please enter a valid title.");
      return;
    }
    if (isNaN(price) || price < 0) {
      showToast("Please enter a valid price.");
      return;
    }

    // Show loading
    const btns = form.querySelectorAll('button');
    btns.forEach(b => { b.disabled = true; b.style.opacity = '0.6'; });

    let imageUrl = null;
    if (selectedFile) {
      imageUrl = await uploadImage(selectedFile);
    }

    const record = {
      title,
      description: fd.get('description')?.trim() || '',
      category: fd.get('category') || 'Furniture',
      condition: fd.get('condition') || 'Excellent',
      price,
      carbon_offset: parseFloat(fd.get('carbon_offset')) || 0,
      seller_id: user.id,
      status,
      currency: 'USD',
    };
    if (imageUrl) record.image_url = imageUrl;

    const { error } = await supabase
      .from('products')
      .insert(record);

    btns.forEach(b => { b.disabled = false; b.style.opacity = '1'; });

    if (error) {
      showToast("Failed to create listing: " + error.message);
      console.error('Insert error:', error);
    } else {
      showToast(status === 'draft' ? "Draft saved!" : "Listing published!");
      navigate('sell');
    }
  }

  // ─── Bind buttons ───
  document.getElementById('btn-save-draft')?.addEventListener('click', (e) => {
    e.preventDefault();
    saveListing('draft');
  });

  document.getElementById('btn-publish-listing')?.addEventListener('click', (e) => {
    e.preventDefault();
    saveListing('active');
  });
}
