import './style.css';
import maplibregl from 'maplibre-gl';
import { createHeatmapLayer } from './map/heatmap.js';
import { createMetaballsLayer } from './map/metaballs.js';
import { initPhotoSphere, openPhotoSphere, closePhotoSphere } from './three/photoSphere.js';
import { fetchPlaces, createPlace } from './services/api.js';

const app = document.querySelector('#app');
app.innerHTML = `
  <aside class="sidebar">
    <div class="glass-card">
      <h2>OwnTravMap</h2>
      <p>Карта відвіданих місць України — персональна статистика для двох людей.</p>
    </div>
    <div class="glass-card">
      <h3>Статистика</h3>
      <div class="stats-grid">
        <div class="stat-row"><span>Відвідано областей</span><strong id="visited-regions">0 / 24</strong></div>
        <div class="stat-row"><span>Всього візитів</span><strong id="total-visits">0</strong></div>
        <div class="stat-row"><span>Топ місто</span><strong id="top-city">—</strong></div>
      </div>
    </div>
    <div class="glass-card">
      <h3>Таймлайн</h3>
      <div class="timeline" id="timeline"></div>
    </div>
  </aside>
  <main class="map-shell">
    <div id="map"></div>
    <canvas class="overlay-canvas" id="metaballs"></canvas>
    <section class="bottom-sheet" id="sheet">
      <h3 id="sheet-title">Нове місце</h3>
      <p id="sheet-subtitle">Підтвердити, що ви були тут?</p>
      <div class="sheet-actions">
        <button id="confirm-place">Підтвердити, що були тут</button>
        <button class="secondary" id="cancel-place">Скасувати</button>
      </div>
    </section>
  </main>
  <div class="modal" id="sphere-modal">
    <div class="modal-content">
      <button class="modal-close secondary" id="close-sphere">Закрити</button>
      <canvas id="sphere-canvas"></canvas>
    </div>
  </div>
`;

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center: [31.1656, 48.3794],
  zoom: 5.3,
  maxZoom: 12,
  minZoom: 4
});

map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

const heatmapLayer = createHeatmapLayer();
const metaballsLayer = createMetaballsLayer(document.getElementById('metaballs'));

map.on('load', async () => {
  map.addSource('places', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] }
  });
  map.addLayer(heatmapLayer);
  map.addLayer({
    id: 'place-points',
    type: 'circle',
    source: 'places',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 2, 10, 6],
      'circle-color': '#8da7ff',
      'circle-opacity': 0.6
    }
  });

  const places = await fetchPlaces();
  updatePlaces(places);
});

function updatePlaces(places) {
  const features = places.map((place) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [place.lng, place.lat] },
    properties: { id: place.id, visits: place.visitsCount, title: place.title }
  }));
  const source = map.getSource('places');
  if (source) {
    source.setData({ type: 'FeatureCollection', features });
  }
  metaballsLayer.update(places, map);
}

let pendingPoint = null;
const sheet = document.getElementById('sheet');
const confirmBtn = document.getElementById('confirm-place');
const cancelBtn = document.getElementById('cancel-place');

map.on('click', (event) => {
  pendingPoint = event.lngLat;
  sheet.classList.add('active');
});

cancelBtn.addEventListener('click', () => {
  pendingPoint = null;
  sheet.classList.remove('active');
});

confirmBtn.addEventListener('click', async () => {
  if (!pendingPoint) return;
  const place = await createPlace({
    title: 'Нове місце',
    lat: pendingPoint.lat,
    lng: pendingPoint.lng,
    tags: ['travel']
  });
  const places = await fetchPlaces();
  updatePlaces(places);
  sheet.classList.remove('active');
});

map.on('move', () => {
  metaballsLayer.render(map);
});

map.on('zoom', () => {
  metaballsLayer.render(map);
});

const modal = document.getElementById('sphere-modal');
const sphereCanvas = document.getElementById('sphere-canvas');
initPhotoSphere(sphereCanvas);

document.getElementById('close-sphere').addEventListener('click', () => {
  closePhotoSphere();
  modal.classList.remove('active');
});

map.on('dblclick', () => {
  modal.classList.add('active');
  openPhotoSphere([
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80'
  ]);
});
