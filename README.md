# Карта відвіданих місць України

## 1) Архітектура проєкту

**Frontend (Vite + MapLibre + Three.js)**
- Рендер карти, heatmap, metaballs та кластери.
- UI у стилі iOS26 (glassmorphism) з bottom sheets та модальними вікнами.
- 3D сфера з фото (Three.js) відкривається при кліку на кластер.
- Робота з API для місць/візитів/фото/статистики.

**Backend (Node.js + Fastify/Express)**
- REST API з JSON-сховищем (`/data/places.json`).
- Робота з файлами фото (`/data/photos/YYYY/MM/`).
- Proxy для геокодингу (обмеження в межах України).
- Кешування та оптимізація за bbox/zoom.

**Зберігання**
- `places.json`: опис місць, візитів, метаданих.
- Файли фото + thumbnails у файловій системі.

## 2) Структура папок

```
/owntravmap
  /apps
    /frontend
      /src
        /components
          MapView.jsx
          HeatLayer.jsx
          MetaballsLayer.jsx
          ClusterSphereModal.jsx
          BottomSheet.jsx
          Dashboard.jsx
          Timeline.jsx
        /styles
          glass.css
        /lib
          api.js
          geo.js
          metaballs.js
          heatmap.js
          clusters.js
      index.html
      vite.config.js
    /backend
      /src
        server.js
        routes
          places.js
          visits.js
          uploads.js
          stats.js
          geocode.js
        services
          placesStore.js
          statsService.js
          geocodeProxy.js
          thumbnails.js
        utils
          bbox.js
          cache.js
      /data
        places.json
        /photos
          2025/03/*.jpg
          2025/03/thumbs/*.jpg
      package.json
```

## 3) Ключові компоненти карти

- **MapView**: ініціалізація MapLibre, режими масштабування, події.
- **HeatLayer**: GPU heatmap на рівні країни (підкладка).
- **MetaballsLayer**: marching squares для області (контур + заливка).
- **Clusters**: кластеризація точок на рівні міста/району.
- **BottomSheet**: форма додавання візиту.
- **ClusterSphereModal**: модальне вікно з 3D сферою фото.

## 4) Реалізація metaball-логіки

**Формула:**

```
F(x, y) = Σ(w_i * kernel(dist(x, p_i) / r_i))
weight = log(1 + visitsCount)
```

**Псевдокод:**

```js
// metaballs.js
const kernel = (t) => Math.max(0, 1 - t * t); // проста ядрова функція

export function computeField(points, grid, zoom) {
  const threshold = 0.9; // поріг, щоб не заливало всю карту
  const field = new Float32Array(grid.width * grid.height);

  points.forEach((p) => {
    const weight = Math.log(1 + p.visitsCount);
    const radius = zoomToRadius(zoom, weight);

    grid.forEachCellInRadius(p, radius, (idx, dist) => {
      const t = dist / radius;
      field[idx] += weight * kernel(t);
    });
  });

  return { field, threshold };
}

export function marchingSquares(field, grid, threshold) {
  // повертає полігон(и) контуру + заливку
}
```

**Рендеринг:**
- Побудовані полігони додаються як GeoJSON layer.
- Стиль: напівпрозора заливка + чіткий контур.

## 5) API-ендпоїнти

```
GET    /api/places?bbox=&zoom=
POST   /api/places
DELETE /api/places/:id
POST   /api/places/:id/visits
POST   /api/upload
GET    /api/stats
GET    /api/geocode?q=
```

## 6) Приклади коду

### 6.1 Карта (MapLibre)

```js
// MapView.jsx
import maplibregl from 'maplibre-gl';

useEffect(() => {
  const map = new maplibregl.Map({
    container: mapRef.current,
    style: 'https://demotiles.maplibre.org/style.json',
    center: [31.2, 48.4], // Україна
    zoom: 5,
    maxBounds: [[22.0, 43.0], [40.5, 53.5]],
  });

  map.on('click', (e) => onAddPlace(e.lngLat));
}, []);
```

### 6.2 Heatmap

```js
map.addSource('heat', {
  type: 'geojson',
  data: heatGeoJson,
});

map.addLayer({
  id: 'heatmap-layer',
  type: 'heatmap',
  source: 'heat',
  paint: {
    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 8, 1.2],
    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 10, 8, 30],
    'heatmap-color': [
      'interpolate', ['linear'], ['heatmap-density'],
      0, 'rgba(0,0,0,0)',
      0.2, '#2b6cb0',
      0.5, '#38b2ac',
      0.8, '#f6ad55',
      1, '#f56565'
    ]
  }
});
```

### 6.3 Metaballs (маршинг-квадрати)

```js
import { computeField, marchingSquares } from './metaballs';

const { field, threshold } = computeField(points, grid, zoom);
const polygons = marchingSquares(field, grid, threshold);

map.getSource('metaballs').setData({
  type: 'FeatureCollection',
  features: polygons
});
```

### 6.4 3D сфера (Three.js)

```js
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
camera.position.z = 3;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(w, h);
container.appendChild(renderer.domElement);

const sphere = new THREE.SphereGeometry(2, 32, 32);
const material = new THREE.MeshBasicMaterial({
  side: THREE.BackSide,
  map: new THREE.TextureLoader().load(photoUrl)
});

const mesh = new THREE.Mesh(sphere, material);
scene.add(mesh);

const animate = () => {
  mesh.rotation.y += 0.003;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

animate();
```

## 7) Оптимізації під 10k точок

1. **BBOX + zoom-запити**: бекенд повертає тільки точки у видимому viewport.
2. **Кешування**: in-memory cache для часто повторюваних bbox/zoom.
3. **Кластеризація**: спрощення точок при високих zoom-out рівнях.
4. **Throttle рендеру**: оновлення metaballs/heatmap із debounce.
5. **WebWorker**: обчислення marching squares у воркері.
6. **Тайли**: попередньо агреговані “теплові” тайли для національного рівня.
7. **Lazy loading**: фото завантажуються тільки в модалці.

