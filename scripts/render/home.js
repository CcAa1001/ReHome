// scripts/render/home.js
import { navigate } from "../router.js";
import { getSession } from "../storage.js";

export async function renderHome() {
  const homeView = document.querySelector("[data-view='home']");
  if (!homeView) return;

  const session = getSession();
  const name = session?.name?.split(" ")[0] ?? "Vivian";

  homeView.innerHTML = `
    <div class="page-shell">
      <section class="greeting">
        <h1>Welcome back, <span data-user-name>${name}</span>.</h1>
        <p>Your conscious curation journey continues.</p>
      </section>

      <section class="feature-grid">
        <article class="feature-card price-card">
          <div class="card-top">
            <span class="round-icon">01</span>
            <span class="pill">Quick action</span>
          </div>
          <h2>Find a piece</h2>
          <p>Browse curated items, save them to your cart, then checkout when you are ready.</p>
          <button class="primary-button" type="button" onclick="navigate('shop')">Open Shop</button>
        </article>

        <article class="feature-card price-card">
          <div class="card-top">
            <span class="round-icon">02</span>
            <span class="pill">For sellers</span>
          </div>
          <h2>List an item</h2>
          <p>Seller and admin menus appear only when your profile role allows those tools.</p>
          <button class="primary-button" type="button" onclick="navigate('seller')">Seller Tools</button>
        </article>

        <article class="feature-card impact-card">
          <div class="impact-copy">
            <span class="eyebrow" style="font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--muted);">Cart Status</span>
            <h2 style="margin:8px 0 0;">Ready to checkout</h2>
            <div class="stats">
              <div><strong data-dashboard-cart-count>3</strong><span>Cart Items</span></div>
              <div><strong>12kg</strong><span>Saved This Order</span></div>
            </div>
          </div>
          <img src="assets/impact.png" alt="Sustainability impact figure">
        </article>
      </section>

      <section class="section-heading" style="display:flex; justify-content:space-between; align-items:flex-end;">
        <div>
          <h2 style="font-family:var(--serif); font-size:32px; margin:0;">Smart Recommendations</h2>
          <p style="margin:8px 0 0; color:var(--muted);">Curated for your Scandinavian aesthetic.</p>
        </div>
        <button type="button" class="text-link" onclick="navigate('shop')" style="background:none; border:none; color:var(--sage); font-weight:700; cursor:pointer;">View Gallery →</button>
      </section>

      <section class="product-grid" style="margin-top:32px; margin-bottom: 64px;">
        <div class="catalog-card" onclick="navigate('curated')">
          <img src="assets/figma-export/c92ff17556827d47a8e24c0f458a0824ae243188.png" alt="Chair">
          <div>
            <span>Artek</span><strong>$450</strong>
            <h3>Birch Stool 60</h3>
          </div>
        </div>
        <div class="catalog-card" onclick="navigate('curated')">
          <img src="assets/figma-export/44087ad14826697196b8166297cc11af65cda235.jpg" alt="Lamp">
          <div>
            <span>Louis Poulsen</span><strong>$890</strong>
            <h3>PH 5 Pendant</h3>
          </div>
        </div>
        <div class="catalog-card" onclick="navigate('curated')">
          <img src="assets/figma-export/50c650dc19d53b235c064dcad7dc23f8b08e5668.png" alt="Sofa">
          <div>
            <span>Muuto</span><strong>$2,100</strong>
            <h3>Outline Sofa</h3>
          </div>
        </div>
      </section>

      <section class="curated-band">
        <div class="section-heading">
          <h2 style="font-family:var(--serif); font-size:32px; margin:0;">Curated Treasures</h2>
          <p style="margin:8px 0 0; color:var(--muted);">Editorial collections for slower, better interiors.</p>
        </div>
        <div class="curated-grid">
          <article style="--img: url('assets/interior.jpg')">
            <span>Editorial</span>
            <h3>The Kinfolk Edit</h3>
            <button type="button" onclick="navigate('curated')">Explore Lookbook</button>
          </article>
          <article style="--img: url('assets/design.jpg')">
            <span>Curation</span>
            <h3>Tactile Textures</h3>
            <button type="button" onclick="navigate('curated')">Explore Lookbook</button>
          </article>
          <article style="--img: url('assets/luxury.jpg')">
            <span>Limited</span>
            <h3>Midnight Serenity</h3>
            <button type="button" onclick="navigate('curated')">Explore Lookbook</button>
          </article>
        </div>
      </section>
    </div>
  `;
}