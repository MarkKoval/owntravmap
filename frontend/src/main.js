import "./styles.css";
import { createAppShell } from "./ui/appShell.js";
import { initMap } from "./map/mapView.js";

const root = document.getElementById("app");
const { mapContainer, timelinePanel, dashboardPanel, sphereModal } = createAppShell(root);

initMap({
  container: mapContainer,
  timelinePanel,
  dashboardPanel,
  sphereModal
});
