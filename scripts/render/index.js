// scripts/render/index.js
import { render as renderAccount }  from "./account.js";
import { renderCart }               from "./cart.js";
import { renderHistory }            from "./history.js";
import { render as renderListings } from "./listings.js";
import { renderProducts }           from "./products.js";
import { render as renderSettings } from "./settings.js";

export { renderAccount, renderCart, renderHistory, renderListings, renderProducts, renderSettings };

export async function renderAll() {
  await Promise.all([
    renderProducts(),
    renderCart(),
    renderHistory(),
    renderListings(),
    renderSettings(),
    renderAccount(),
  ]);
}