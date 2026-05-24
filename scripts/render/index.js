import { renderAccount } from "./account.js";
import { renderCart } from "./cart.js?v=20260524-database4";
import { renderHistory } from "./history.js";
import { renderListings } from "./listings.js";
import { renderProducts } from "./products.js?v=20260524-database4";
import { renderSettings } from "./settings.js?v=20260524-database4";

export async function renderAll() {
  await renderProducts();
  await renderCart();
  renderHistory();
  renderListings();
  await renderSettings();
  renderAccount();
}

export { bindCartRemoval, renderCart } from "./cart.js?v=20260524-database4";
export { renderListings } from "./listings.js";
export { renderSettings } from "./settings.js?v=20260524-database4";
export { renderAccount } from "./account.js";
