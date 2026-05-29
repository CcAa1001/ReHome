// scripts/render/index.js
import { renderAccount }  from "./account.js";
import { renderCart }     from "./cart.js";
import { renderHistory }  from "./history.js";
import { renderListings } from "./listings.js";
import { renderProducts } from "./products.js";
import { renderSettings } from "./settings.js";
import { renderHome }     from "./home.js";         

export {
  renderAccount, renderCart, renderHistory,
  renderListings, renderProducts, renderSettings,
  renderHome                                        
};

export async function renderAll() {
  await Promise.all([
    renderHome(),          
    renderProducts(),
    renderCart(),
    renderHistory(),
    renderListings(),
    renderSettings(),
    renderAccount(),
  ]);
}