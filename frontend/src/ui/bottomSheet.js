import { addPlace, addVisit } from "../api/client.js";

export function createBottomSheet(container, onSaved) {
  const sheet = document.createElement("div");
  sheet.className = "bottom-sheet";
  sheet.innerHTML = `
    <div class="sheet-handle"></div>
    <h3 class="sheet-title">Нове місце</h3>
    <form class="sheet-form">
      <label>Назва <input name="name" placeholder="Місце" required /></label>
      <label>Адреса <input name="address" placeholder="Адреса" /></label>
      <label>Дата і час <input name="visitedAt" type="datetime-local" /></label>
      <label>Рейтинг <input name="rating" type="number" min="1" max="10" value="8" /></label>
      <label>Нотатка <textarea name="note" rows="3"></textarea></label>
      <label>Теги <input name="tags" placeholder="nature, food" /></label>
      <button type="submit">Підтвердити, що були тут</button>
    </form>
  `;

  const form = sheet.querySelector(".sheet-form");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const tags = data
      .get("tags")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payload = {
      name: data.get("name"),
      address: data.get("address"),
      tags
    };

    const place = await addPlace({ ...payload, coordinates: sheet.dataset.coordinates.split(",").map(Number) });

    await addVisit(place.id, {
      visitedAt: data.get("visitedAt"),
      rating: data.get("rating"),
      note: data.get("note"),
      tags
    });

    sheet.classList.remove("open");
    form.reset();
    onSaved();
  });

  container.appendChild(sheet);

  return {
    open(coordinates) {
      sheet.dataset.coordinates = coordinates.join(",");
      sheet.classList.add("open");
    }
  };
}
