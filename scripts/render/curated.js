import { showToast } from "../ui.js";

export async function renderCurated() {
  const container = document.getElementById("router-view");
  if (!container) return;

  const btnValuation = container.querySelector('[data-action="valuation"]');
  const resultPanel = container.querySelector('#ai-result-panel');
  
  if (btnValuation && resultPanel) {
    btnValuation.addEventListener("click", () => {
      const originalText = btnValuation.innerHTML;
      btnValuation.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10"></circle><path d="M12 2v4"></path></svg> Scanning with AI...`;
      btnValuation.disabled = true;
      btnValuation.style.opacity = '0.7';
      
      // Simulate network request/AI scan delay
      setTimeout(() => {
        btnValuation.innerHTML = originalText;
        btnValuation.disabled = false;
        btnValuation.style.opacity = '1';
        
        showToast("Analysis complete. Found matching global listings.");
        
        resultPanel.style.display = 'flex';
        // Allow DOM to update display before transitioning opacity
        setTimeout(() => {
          resultPanel.style.opacity = '1';
          // Scroll into view gently
          resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      }, 2000);
    });
  }
}