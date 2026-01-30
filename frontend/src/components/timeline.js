export function renderTimeline(places) {
  const root = document.getElementById('timeline');
  if (!root) return;
  const visits = places.flatMap((place) =>
    (place.visits || []).map((visit) => ({ ...visit, place }))
  );
  visits.sort((a, b) => new Date(b.at) - new Date(a.at));

  root.innerHTML = `
    <div class="card">
      <h3>Таймлайн</h3>
      <ul>
        ${visits
          .slice(0, 12)
          .map(
            (visit) => `
            <li>
              <strong>${visit.place.title}</strong>
              <div>${new Date(visit.at).toLocaleString('uk-UA')}</div>
              <div>Рейтинг: ${visit.rating}</div>
            </li>
          `
          )
          .join('')}
      </ul>
    </div>
  `;
}
