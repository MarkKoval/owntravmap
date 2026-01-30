export function createDashboard() {
  const element = document.createElement("section");
  element.className = "panel dashboard-panel";
  element.innerHTML = `
    <div class="panel-header">
      <h2>Статистика</h2>
      <button class="close-btn">Закрити</button>
    </div>
    <div class="panel-content">
      <div class="stats-grid">
        <div class="stat">
          <div class="stat-title">Області</div>
          <div class="stat-value" data-stat="regions">0/24</div>
        </div>
        <div class="stat">
          <div class="stat-title">Візити</div>
          <div class="stat-value" data-stat="visits">0</div>
        </div>
        <div class="stat">
          <div class="stat-title">Топ місто</div>
          <div class="stat-value" data-stat="top-city">—</div>
        </div>
        <div class="stat">
          <div class="stat-title">Популярний тег</div>
          <div class="stat-value" data-stat="top-tag">—</div>
        </div>
      </div>
      <div class="chart" data-chart="monthly"></div>
    </div>
  `;

  element.querySelector(".close-btn").addEventListener("click", () => {
    element.classList.remove("open");
  });

  return {
    element,
    toggle() {
      element.classList.toggle("open");
    },
    setStats(stats) {
      element.querySelector("[data-stat='visits']").textContent = stats.totalVisits;
      element.querySelector("[data-stat='regions']").textContent = stats.regions;
      element.querySelector("[data-stat='top-city']").textContent = stats.topCity;
      element.querySelector("[data-stat='top-tag']").textContent = stats.topTag;
    }
  };
}
