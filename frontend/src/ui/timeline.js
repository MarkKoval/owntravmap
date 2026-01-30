export function createTimeline() {
  const element = document.createElement("section");
  element.className = "panel timeline-panel";
  element.innerHTML = `
    <div class="panel-header">
      <h2>Таймлайн</h2>
      <button class="close-btn">Закрити</button>
    </div>
    <div class="panel-content">
      <div class="filters">
        <label>Теги <input type="text" placeholder="nature, food" /></label>
        <label>Рейтинг від <input type="number" min="1" max="10" value="1" /></label>
        <label>До <input type="number" min="1" max="10" value="10" /></label>
        <label>Дата <input type="date" /></label>
      </div>
      <ul class="timeline-list"></ul>
    </div>
  `;

  const closeBtn = element.querySelector(".close-btn");
  closeBtn.addEventListener("click", () => element.classList.remove("open"));

  return {
    element,
    setItems(items) {
      const list = element.querySelector(".timeline-list");
      list.innerHTML = items
        .map(
          (item) => `
            <li class="timeline-item" data-id="${item.id}">
              <div class="timeline-title">${item.name}</div>
              <div class="timeline-meta">${item.visitedAt} • ★${item.rating}</div>
              <div class="timeline-note">${item.note || ""}</div>
            </li>
          `
        )
        .join("");
    },
    toggle() {
      element.classList.toggle("open");
    }
  };
}
