import { createMap } from './map/map';
import { renderDashboard } from './components/dashboard';
import { renderTimeline } from './components/timeline';
import { openBottomSheet } from './components/bottomSheet';
import { fetchPlaces, fetchStats } from './utils/api';

export async function initApp() {
  const map = await createMap('map');

  async function refreshData() {
    const bounds = map.getBounds();
    const zoom = map.getZoom();
    const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()].join(',');
    const placesData = await fetchPlaces({ bbox, zoom });
    map.updateData(placesData);
    const stats = await fetchStats();
    renderDashboard(stats);
    renderTimeline(placesData.places || []);
  }

  map.onIdle(refreshData);
  refreshData();

  document.getElementById('add-place').addEventListener('click', () => {
    openBottomSheet({
      title: 'Додати місце',
      description: 'Клікніть по карті, щоб обрати точку, або скористайтесь пошуком.'
    });
  });
}
