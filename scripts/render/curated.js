// scripts/render/curated.js
import { showToast } from "../ui.js";

// Karena layout AI Price Checker sudah ada di views/curated.html,
// JS ini sekarang hanya bertugas menghidupkan tombol-tombolnya saja.
export async function renderCurated() {
  const container = document.getElementById("router-view");
  if (!container) return;

  const btnValuation = container.querySelector('[data-action="valuation"]');
  if (btnValuation) {
    btnValuation.addEventListener("click", () => {
      showToast("Analyzing item via AI... Estimated Fair Price: $1,240");
    });
  }
}