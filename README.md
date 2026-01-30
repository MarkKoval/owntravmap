# OwnTravMap — Карта відвіданих місць України

Це стартова архітектура та реалізація MVP для Raspberry Pi 4: фронтенд (Vite + MapLibre + Three.js) і бекенд (Node.js + Express + JSON storage). Проєкт зосереджений на UI у стилі iOS26, heatmap, metaballs та 3D-сфері.

## 1) Архітектура

**Frontend (Vite + MapLibre + Three.js)**
- Відповідає за карту, heatmap, metaballs, UI-стікери, bottom-sheet, модальну 3D-сферу.
- Дані отримує з REST API.

**Backend (Node.js + Express)**
- Зберігає дані у `backend/data/places.json`.
- Фото зберігає у `backend/data/photos/YYYY/MM/`.
- Публікує REST API (див. нижче).

## 2) Структура папок

```
owntravmap/
├─ backend/
│  ├─ data/
│  │  ├─ places.json
│  │  ├─ photos/
│  │  └─ thumbnails/
│  ├─ src/
│  │  └─ server.js
│  └─ package.json
├─ frontend/
│  ├─ public/
│  ├─ src/
│  │  ├─ map/
│  │  │  ├─ heatmap.js
│  │  │  └─ metaballs.js
│  │  ├─ services/
│  │  │  └─ api.js
│  │  ├─ three/
│  │  │  └─ photoSphere.js
│  │  ├─ main.js
│  │  └─ style.css
│  ├─ index.html
│  └─ package.json
└─ README.md
```

## 3) Ключові компоненти карти

- **MapLibre GL JS** як базова карта.
- **Heatmap layer** через `heatmap` шар MapLibre.
- **Metaballs** рендеряться у canvas overlay для рівня області.
- **Clusters** додаються на рівні міста (у цьому MVP — точковий шар із можливістю відкриття 3D-сфери).

## 4) Реалізація metaball-логіки

Формула поля:
```
F(x, y) = Σ(w_i * kernel(dist(x, p_i) / r_i))
```

- Вага `w_i = log(1 + visitsCount)`.
- Радіус залежить від zoom.
- Контур побудований через marching squares (спрощений grid-based підхід).

Приклад коду (див. `frontend/src/map/metaballs.js`).

## 5) API ендпоїнти

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

### Карта (MapLibre)
```js
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center: [31.1656, 48.3794],
  zoom: 5.3
});
```

### Heatmap (MapLibre heatmap layer)
```js
map.addLayer({
  id: 'visits-heatmap',
  type: 'heatmap',
  source: 'places',
  paint: {
    'heatmap-weight': ['interpolate', ['linear'], ['get', 'visits'], 0, 0, 8, 1],
    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 12, 8, 32]
  }
});
```

### Metaballs (canvas overlay)
```js
const radius = Math.max(40, baseRadius + weight * 12);
const ratio = dist / radius;
field[x][y] += weight * kernel(ratio);
```

### 3D сфера (Three.js)
```js
const geometry = new THREE.SphereGeometry(5, 48, 48);
geometry.scale(-1, 1, 1);
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);
```

## 7) Оптимізації під 10k точок

1. **BBox запити**: запитувати тільки видимі точки (`/api/places?bbox=`).
2. **Кешування**: зберігати відповіді по bbox + zoom на бекенді.
3. **Зміна деталізації**: на zoom=країна — агрегація по областях, на zoom=місто — кластери.
4. **GPU heatmap**: heatmap на стороні карти (GL) або окремий shader.
5. **Metaballs**: рендерити на меншій сітці й апдейтити тільки при move/zoom.
6. **Фото**: thumbnails, lazy-loading, кешування у браузері.

## Запуск

```bash
cd backend && npm install && npm run dev
```

```bash
cd frontend && npm install && npm run dev
```

> Порт бекенду: `3001`, фронтенду: `5173`.
