import { elements } from "../dom.js";
import { loadDatabase } from "../storage.js";

let activeFilter = "all";

export function setListingFilter(filter) {
  activeFilter = filter;
}

function createListingCard(listing) {
  const card = document.createElement("article");
  card.className = "listing-card";
  card.innerHTML = `
    <img src="${listing.image}" alt="${listing.title}">
    <div>
      <span class="eyebrow">${listing.label}</span>
      <h3>${listing.title}</h3>
      <p>${listing.views} views</p>
      <footer><strong>${listing.price}</strong><a>Edit</a></footer>
    </div>
  `;
  return card;
}

function createNewListingCard() {
  const card = document.createElement("article");
  card.className = "listing-card";
  card.innerHTML = `
    <img src="assets/figma-export/268b036d427a5127a614793cadef99464ad05a75.png" alt="Botanical listing illustration">
    <div>
      <span class="eyebrow">Curated Zero Waste</span>
      <h3>Create New Listing</h3>
      <p>4 slots remaining</p>
      <footer><small></small><a>Edit</a></footer>
    </div>
  `;
  return card;
}

// Tambahkan di dalam export function render() di listings.js,
// setelah form sudah ada di DOM:

function bindImagePreview() {
  const fileInput   = document.querySelector("[data-new-listing-form] [name='imageFile']");
  const urlInput    = document.querySelector("[data-new-listing-form] [name='imageUrl']");
  const form        = document.querySelector("[data-new-listing-form]");
  if (!form) return;

  // Buat elemen preview sekali
  let preview = form.querySelector(".image-preview-box");
  if (!preview) {
    preview = document.createElement("img");
    preview.className = "image-preview-box";
    preview.alt = "Image preview";
    form.appendChild(preview);
  }

  function showPreview(src) {
    if (!src) {
      preview.classList.remove("is-visible");
      return;
    }
    preview.src = src;
    preview.classList.add("is-visible");
  }

  fileInput?.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) { showPreview(""); return; }
    const reader = new FileReader();
    reader.onload = (e) => showPreview(e.target.result);
    reader.readAsDataURL(file);
  });

  urlInput?.addEventListener("input", () => {
    const url = urlInput.value.trim();
    showPreview(url || "");
  });
}


export function renderListings() {
  const database = loadDatabase();
  const listings = activeFilter === "all"
    ? database.listings
    : database.listings.filter((listing) => listing.status === activeFilter);

  elements.listingGrid.replaceChildren(createNewListingCard(), ...listings.map(createListingCard));
}
