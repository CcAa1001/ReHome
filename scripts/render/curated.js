import { showToast } from "../ui.js";

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