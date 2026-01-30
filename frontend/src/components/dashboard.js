export function renderDashboard(stats) {
  const root = document.getElementById('dashboard');
  if (!root) return;
  root.innerHTML = `
    <div class="stat-grid">
      <div class="card">
        <h3>Відвідано областей</h3>
        <p>${stats.regions?.length || 0} / 24</p>
      </div>
      <div class="card">
        <h3>Топ міста</h3>
        <ul>
          ${(stats.topCities || []).map((city) => `<li>${city.city}: ${city.visits}</li>`).join('')}
        </ul>
      </div>
      <div class="card">
        <h3>Теги</h3>
        <ul>
          ${(stats.topTags || []).map((tag) => `<li>${tag.tag}: ${tag.visits}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;
}
