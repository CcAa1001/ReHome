// scripts/render/home.js
import { navigate } from "../router.js";
import { getSession } from "../storage.js";
import { getProducts } from "../supabaseDatabase.js";

export async function renderHome() {
  const homeView = document.querySelector("[data-view='home']");
  if (!homeView) return;

  const session = getSession();
  const name = session?.name?.split(" ")[0] ?? "Vivian";

  homeView.innerHTML = `
    <div class="page-shell">
      <section class="greeting">
        <h1>Welcome back, <em>${name}</em>.</h1>
        <p>Your conscious curation journey continues.</p>
      </section>

      <section class="feature-grid-2col">
        <article class="feature-card ai-card">
          <div class="card-top">
            <span class="round-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
            </span>
            <span class="pill">New Feature</span>
          </div>
          <h2>AI Price Checker</h2>
          <p>Scan any pre-owned luxury item to instantly determine its fair market value based on real-time data.</p>
          <button class="primary-button route-btn" data-target="curated">Try the Scanner</button>
        </article>

        <article class="feature-card impact-card">
          <div class="impact-copy">
            <span class="eyebrow" style="margin-bottom: 12px; display: inline-block; text-transform:uppercase; letter-spacing:1px; color:#78716c; font-weight:800; font-size:11px;">⊙ Impact Report</span>
            <h2 style="margin:0 0 16px; font-size: 24px; font-family: var(--sans, sans-serif); font-weight:700;">Your Sustainability Impact</h2>
            <div class="stats">
              <div><strong style="color: var(--sage);">450kg</strong><span>Carbon Offset</span></div>
              <div><strong style="color: var(--ink);">124</strong><span>Items ReHomed</span></div>
            </div>
          </div>
          <img src="assets/impact.png" alt="Sustainability impact figure" style="object-position: right center;">
        </article>
      </section>

      <section class="section-heading">
        <div>
          <h2>Smart Recommendations</h2>
          <p>Curated for your Scandinavian aesthetic.</p>
        </div>
        <button type="button" class="text-link route-btn" data-target="shop">View Gallery →</button>
      </section>

      <section class="product-grid" id="home-product-grid"></section>

      <section class="curated-band">
        <div class="section-heading">
          <div>
            <h2>Curated Treasures</h2>
            <p>Editorial collections for slower, better interiors.</p>
          </div>
        </div>
        <div class="curated-grid">
          <article style="--img: url('assets/interior.jpg')" class="route-btn" data-target="product-detail">
            <span>Editorial</span>
            <h3>The Kinfolk Edit</h3>
            <button type="button" class="ghost-button" style="border-color:rgba(255,255,255,0.3); color:white;">Explore Lookbook</button>
          </article>
          <article style="--img: url('assets/design.jpg')" class="route-btn" data-target="product-detail">
            <span>Curation</span>
            <h3>Tactile Textures</h3>
            <button type="button" class="ghost-button" style="border-color:rgba(255,255,255,0.3); color:white;">Explore Lookbook</button>
          </article>
          <article style="--img: url('assets/luxury.jpg')" class="route-btn" data-target="product-detail">
            <span>Limited</span>
            <h3>Midnight Serenity</h3>
            <button type="button" class="ghost-button" style="border-color:rgba(255,255,255,0.3); color:white;">Explore Lookbook</button>
          </article>
        </div>
      </section>
    </div>
  `;

  homeView.querySelectorAll(".route-btn").forEach(btn => {
    btn.addEventListener("click", () => navigate(btn.dataset.target));
  });

  try {
    const products = await getProducts();
    const featured = products.slice(0, 3);
    const grid = homeView.querySelector("#home-product-grid");
    if (grid) {
      grid.innerHTML = featured.map(p => `
        <div class="catalog-card route-btn" data-target="product-detail">
          <img src="${p.image}" alt="${p.alt}">
          <div><span>${p.maker}</span><strong>${p.price}</strong><h3>${p.title}</h3></div>
        </div>
      `).join("");
      grid.querySelectorAll(".route-btn").forEach(btn => {
        btn.addEventListener("click", () => navigate(btn.dataset.target));
      });
    }
  } catch (err) { console.warn(err); }
}