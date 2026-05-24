import { elements } from "../dom.js";
import { loadDatabase } from "../storage.js";

export function renderHistory() {
  const database = loadDatabase();

  elements.historyList.replaceChildren(...database.history.map((item) => {
    const card = document.createElement("article");
    card.className = "history-card";
    card.innerHTML = `
      <div>
        <header><time>${item.date}</time><span>${item.status}</span></header>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
      </div>
      <div>
        <strong>${item.price}</strong>
        <button class="ghost-button" type="button">${item.action}</button>
      </div>
    `;
    return card;
  }));
}
