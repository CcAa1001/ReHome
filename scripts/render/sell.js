// scripts/render/sell.js
import { createRemoteProduct } from "../supabaseDatabase.js";
import { navigate } from "../router.js";
import { showToast } from "../ui.js";

export function renderSell() {
  const container = document.getElementById("router-view");
  if (!container) return;

  container.innerHTML = `
    <style>
      .sell-wrapper { max-width: 720px; margin: 0 auto; padding-bottom: 80px; font-family: var(--sans, sans-serif); color: #1c1917; }
      .sell-wrapper h1 { font-family: var(--serif, serif); font-size: 40px; margin-bottom: 8px; }
      .sell-wrapper p.sub { color: #78716c; margin-bottom: 40px; }
      .sell-group { margin-bottom: 24px; }
      .sell-group label { display: block; font-size: 13px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; color: #1c1917; }
      .sell-group input, .sell-group textarea, .sell-group select {
        width: 100%; padding: 14px 16px; border: 1px solid rgba(197,200,188,0.8);
        border-radius: 12px; font-size: 15px; outline: none; font-family: inherit;
        background: white; color: #1c1917; transition: border-color 0.2s;
      }
      .sell-group input:focus, .sell-group textarea:focus, .sell-group select:focus { border-color: #3d5a30; }
      .sell-group textarea { min-height: 120px; resize: vertical; }
      .sell-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
      .sell-preview { width: 100%; height: 240px; object-fit: cover; border-radius: 12px; background: #f4f3ef; display: none; margin-top: 12px; border: 1px solid rgba(197,200,188,0.5); }
      .sell-preview.show { display: block; }
      .sell-submit { width: 100%; background: #526442; color: white; border: none; padding: 18px; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; transition: background 0.2s; margin-top: 16px; }
      .sell-submit:hover { background: #3d5a30; }
      .sell-submit:disabled { opacity: 0.6; cursor: not-allowed; }
      .sell-error { color: #dc2626; font-size: 14px; margin-top: 8px; min-height: 20px; }
    </style>

    <div class="page-shell sell-wrapper">
      <h1>List Your Piece</h1>
      <p class="sub">Share a preloved item with our community of conscious buyers.</p>

      <div class="sell-group">
        <label>Item Name *</label>
        <input type="text" name="title" placeholder="e.g. Walnut Writing Bureau" required>
      </div>

      <div class="sell-row">
        <div class="sell-group">
          <label>Price (USD) *</label>
          <input type="number" name="price" placeholder="e.g. 1200" min="0" required>
        </div>
        <div class="sell-group">
          <label>Maker / Brand</label>
          <input type="text" name="maker" placeholder="e.g. Independent Seller">
        </div>
      </div>

      <div class="sell-row">
        <div class="sell-group">
          <label>Category *</label>
          <select name="category">
            <option>Seating</option>
            <option>Storage & Tables</option>
            <option>Textiles</option>
            <option>Decor</option>
            <option>Lighting</option>
            <option>Other Furniture</option>
          </select>
        </div>
        <div class="sell-group">
          <label>Condition *</label>
          <select name="condition">
            <option>Like New</option>
            <option>Excellent</option>
            <option>Good</option>
            <option>Fair</option>
          </select>
        </div>
      </div>

      <div class="sell-group">
        <label>Description *</label>
        <textarea name="description" placeholder="Describe the item — materials, history, dimensions, any wear..."></textarea>
      </div>

      <div class="sell-group">
        <label>Item Photo *</label>
        <input type="file" name="imageFile" accept="image/*">
        <img class="sell-preview" id="sell-img-preview" alt="Preview">
      </div>

      <div class="sell-group">
        <label>Carbon Offset (kg CO₂ saved)</label>
        <input type="number" name="carbonOffset" placeholder="e.g. 12" min="0" value="1">
      </div>

      <p class="sell-error" id="sell-error"></p>
      <button class="sell-submit" id="sell-submit-btn">List My Item</button>
    </div>
  `;

  // Image preview
  const fileInput = container.querySelector('input[name="imageFile"]');
  const preview = container.querySelector("#sell-img-preview");
  fileInput?.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file) {
      preview.src = URL.createObjectURL(file);
      preview.classList.add("show");
    }
  });

  // Submit
  const submitBtn = container.querySelector("#sell-submit-btn");
  const errorEl = container.querySelector("#sell-error");

  submitBtn?.addEventListener("click", async () => {
    errorEl.textContent = "";

    const formData = new FormData();
    formData.append("title",        container.querySelector('[name="title"]').value.trim());
    formData.append("price",        container.querySelector('[name="price"]').value);
    formData.append("maker",        container.querySelector('[name="maker"]').value.trim());
    formData.append("category",     container.querySelector('[name="category"]').value);
    formData.append("condition",    container.querySelector('[name="condition"]').value);
    formData.append("description",  container.querySelector('[name="description"]').value.trim());
    formData.append("carbonOffset", container.querySelector('[name="carbonOffset"]').value);
    const file = fileInput?.files[0];
    if (file) formData.append("imageFile", file);

    // Basic validation
    if (!formData.get("title")) { errorEl.textContent = "Item name is required."; return; }
    if (!formData.get("price")) { errorEl.textContent = "Price is required."; return; }
    if (!formData.get("description")) { errorEl.textContent = "Description is required."; return; }
    if (!file) { errorEl.textContent = "Please upload a photo of your item."; return; }

    submitBtn.textContent = "Listing...";
    submitBtn.disabled = true;

    try {
      await createRemoteProduct(formData);
      showToast("Your item has been listed successfully!");
      navigate("shop");
    } catch (err) {
      errorEl.textContent = err.message ?? "Failed to list item. Please try again.";
      submitBtn.textContent = "List My Item";
      submitBtn.disabled = false;
    }
  });
}