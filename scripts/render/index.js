// scripts/render/index.js
import { renderAccount } from "./account.js";
import { renderCart } from "./cart.js";
import { renderHistory } from "./history.js";
import { renderListings } from "./listings.js";
import { renderProducts } from "./products.js";
import { renderSettings } from "./settings.js";

// Ekspor fungsi agar bisa diakses oleh app.js
export { renderAccount, renderCart, renderHistory, renderListings, renderProducts, renderSettings };

export async function renderAll() {
  await renderProducts();
  await renderCart();
  await renderHistory();
  await renderListings();
  await renderSettings();
  await renderAccount();
}