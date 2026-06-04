// scripts/render/seller.js
// Renderer untuk halaman Seller Dashboard — ReHome SPA

/* ─────────────────────────────────────────
   DATA (ganti dengan fetch ke API nyata)
───────────────────────────────────────── */
const CHART_DATA = [
  { week: "Week 1", value: 820,  active: false },
  { week: "Week 2", value: 640,  active: false },
  { week: "Week 3", value: 1850, active: true  },  // highlighted bar
  { week: "Week 4", value: 1100, active: false },
];

const LISTINGS = [
  {
    id: "listing-1",
    title: "Eames Style Lounge",
    price: "$1,200",
    tags: ["Vintage", "Wood"],
    badge: { type: "curated", label: "Curated" },
    views: 452,
    img: "assets/figma-export/50c650dc19d53b235c064dcad7dc23f8b08e5668.png",
    status: "all",
  },
  {
    id: "listing-2",
    title: "Artisan Clay Vase",
    price: "$85",
    tags: ["Handmade", "Ceramic"],
    badge: { type: "zerowaste", label: "Zero Waste" },
    views: 128,
    img: "assets/figma-export/70e1f26af8d8c8a801bc699d95272597eb1791a6.png",
    status: "all",
  },
  {
    id: "listing-3",
    title: "Pure Flax Bedding",
    price: "$210",
    tags: ["Sustainable", "Linen"],
    badge: null,
    views: 89,
    img: "",
    status: "all",
  },
];

const SLOTS_REMAINING = 4;

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function badgeSVG(type) {
  if (type === "curated") {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline></svg>`;
  }
  // zerowaste — leaf icon
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12"/></svg>`;
}

function eyeSVG() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
}

/* ─────────────────────────────────────────
   RENDER: BAR CHART
───────────────────────────────────────── */
function renderBarChart() {
  const container = document.getElementById("seller-bar-chart");
  if (!container) return;

  const maxVal = Math.max(...CHART_DATA.map(d => d.value));

  container.innerHTML = CHART_DATA.map(d => {
    const heightPct = Math.round((d.value / maxVal) * 100);
    return `
      <div class="bar-group${d.active ? " show-tip" : ""}">
        <div class="bar-tooltip">${d.active ? "Current: " : ""}$${d.value.toLocaleString()}</div>
        <div class="bar${d.active ? " active" : ""}" style="height:${heightPct}%;"></div>
      </div>`;
  }).join("");

  // Hover: show tooltip on any bar
  container.querySelectorAll(".bar-group").forEach(group => {
    group.addEventListener("mouseenter", () => group.classList.add("show-tip"));
    group.addEventListener("mouseleave", () => {
      // keep the "active" bar tooltip always visible
      const bar = group.querySelector(".bar");
      if (!bar.classList.contains("active")) group.classList.remove("show-tip");
    });
  });
}

/* ─────────────────────────────────────────
   RENDER: LISTING CARD
───────────────────────────────────────── */
function buildListingCard(item) {
  const badgeHTML = item.badge
    ? `<div class="listing-badge ${item.badge.type}">${badgeSVG(item.badge.type)}${item.badge.label}</div>`
    : "";

  const imgHTML = item.img
    ? `<img src="${item.img}" alt="${item.title}" loading="lazy">`
    : `<img src="" alt="${item.title}" style="background:#e0ddd6;">`;

  const tagsHTML = item.tags
    .map(t => `<span class="listing-tag">${t}</span>`)
    .join("");

  const card = document.createElement("div");
  card.className = "listing-card";
  card.dataset.id = item.id;
  card.innerHTML = `
    <div class="listing-img-wrap">
      ${imgHTML}
      ${badgeHTML}
    </div>
    <div class="listing-body">
      <div class="listing-title-row">
        <h3>${item.title}</h3>
        <span class="listing-price">${item.price}</span>
      </div>
      <div class="listing-tags">${tagsHTML}</div>
      <div class="listing-footer">
        <div class="listing-views">
          ${eyeSVG()}
          ${item.views} views
        </div>
        <button class="btn-edit-item" data-id="${item.id}">Edit</button>
      </div>
    </div>`;
  return card;
}

function buildNewListingCard() {
  const card = document.createElement("div");
  card.className = "listing-card-new";
  card.id = "btn-create-listing";
  card.innerHTML = `
    <div class="new-listing-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </div>
    <h3>Create New Listing</h3>
    <span>${SLOTS_REMAINING} Slots Remaining</span>`;
  return card;
}

/* ─────────────────────────────────────────
   RENDER: LISTINGS GRID
───────────────────────────────────────── */
function renderListings(filter = "all") {
  const grid = document.getElementById("listings-grid");
  if (!grid) return;
  grid.innerHTML = "";

  const filtered = filter === "all"
    ? LISTINGS
    : LISTINGS.filter(l => l.status === filter);

  filtered.forEach(item => grid.appendChild(buildListingCard(item)));
  grid.appendChild(buildNewListingCard());

  // Edit button listeners
  grid.querySelectorAll(".btn-edit-item").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const id = btn.dataset.id;
      console.log(`[Seller] Edit listing: ${id}`);
      // TODO: navigate ke form edit listing
    });
  });

  // Create new listing
  const newCard = document.getElementById("btn-create-listing");
  if (newCard) {
    newCard.addEventListener("click", () => {
      console.log("[Seller] Create new listing clicked");
      // TODO: navigate ke halaman tambah listing
    });
  }
}

/* ─────────────────────────────────────────
   RENDER: FILTER TABS
───────────────────────────────────────── */
function bindFilterTabs() {
  const tabs = document.querySelectorAll("#listing-filter-tabs .filter-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderListings(tab.dataset.filter);
    });
  });
}

/* ─────────────────────────────────────────
   RENDER: QUICK ACTIONS
───────────────────────────────────────── */
function bindQuickActions() {
  document.getElementById("btn-upload-item")?.addEventListener("click", () => {
    console.log("[Seller] Upload Item clicked");
    // TODO: navigasi ke form upload item
  });

  document.getElementById("btn-sales-history")?.addEventListener("click", () => {
    console.log("[Seller] Sales History clicked");
    // TODO: navigasi ke halaman sales history
  });

  document.getElementById("btn-seller-support")?.addEventListener("click", () => {
    console.log("[Seller] Seller Support clicked");
    // TODO: buka modal atau navigasi ke halaman support
  });

  document.getElementById("btn-download-report")?.addEventListener("click", () => {
    console.log("[Seller] Download Report clicked");
    // TODO: trigger download PDF report
  });
}

/* ─────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────── */
export function renderSeller() {
  renderBarChart();
  renderListings("all");
  bindFilterTabs();
  bindQuickActions();
}