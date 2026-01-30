import { createTimeline } from "./timeline.js";
import { createDashboard } from "./dashboard.js";
import { createPhotoSphereModal } from "./photoSphere.js";

export function createAppShell(root) {
  root.innerHTML = `
    <div class="app">
      <header class="top-bar">
        <div class="brand">OwnTravMap</div>
        <div class="actions">
          <button class="action-btn" data-action="timeline">Таймлайн</button>
          <button class="action-btn" data-action="dashboard">Дашборд</button>
        </div>
      </header>
      <main class="map-shell">
        <div id="map" class="map"></div>
        <div class="overlay" id="overlay"></div>
      </main>
    </div>
  `;

  const mapContainer = root.querySelector("#map");
  const overlay = root.querySelector("#overlay");

  const timelinePanel = createTimeline();
  const dashboardPanel = createDashboard();
  const sphereModal = createPhotoSphereModal();

  overlay.append(timelinePanel.element, dashboardPanel.element, sphereModal.element);

  root.querySelector("[data-action='timeline']").addEventListener("click", () => {
    timelinePanel.toggle();
  });

  root.querySelector("[data-action='dashboard']").addEventListener("click", () => {
    dashboardPanel.toggle();
  });

  return { mapContainer, timelinePanel, dashboardPanel, sphereModal };
}
