# OwnTravMap — карта відвіданих місць України

## Архітектура

**Рівні:**
- **Frontend (Vite + MapLibre GL + Three.js)** — інтерфейс карти, bottom sheet, таймлайн, дашборд і 3D сфера. Дані отримуються з backend по viewport. Метаболи рахуються у JS і накладаються на карту як line-шар, паралельно працює GPU heatmap шар MapLibre.
- **Backend (Node.js + Express)** — файлове сховище JSON, робота з фотографіями, кеш геокодингу, API для візитів/статистики.
- **Дані:** JSON-файл `backend/data/places.json` + файлове сховище фото `backend/data/photos/YYYY/MM/DD`.

## Структура папок

```
frontend/
  index.html
  src/
    api/           # HTTP клієнт до backend
    map/           # логіка карти, metaballs, 3D сфера
    ui/            # bottom sheet, таймлайн, дашборд
    styles.css
backend/
  data/
    places.json
    photos/
  src/
    routes/        # REST API
    services/      # файлове сховище
    utils/
```

## Логіка карти, metaballs і heatmap

1. **Heatmap (GPU)**
   - MapLibre шар `heatmap` отримує точки з вагами `visitsCount`, керується радіусом через `interpolate` по zoom.
2. **Metaballs (CPU)**
   - Для кожного місця створюється поле впливу `weight = log(1 + visitsCount)`.
   - Поле сумується на гріді, контури будуються через marching squares.
   - Контури рендеряться як `LineString` у GeoJSON.

## Приклади ключового коду

### 1) Завантаження даних по viewport + heatmap + metaballs

```js
const { places } = await fetchPlaces({ bbox, zoom });
map.getSource("places").setData({ type: "FeatureCollection", features });

const contours = generateMetaballContours({
  points,
  gridSize: zoom > 8 ? 0.02 : 0.05,
  threshold: 0.6,
  bounds: bbox
});
```

### 2) Backend: API для візитів

```js
router.post("/:id/visits", async (req, res) => {
  const updated = await updatePlace(id, (place) => ({
    ...place,
    visits: [...(place.visits || []), visit],
    visitsCount: (place.visitsCount || 0) + 1
  }));
});
```

### 3) 3D сфера фотографій (Three.js)

```js
const geometry = new THREE.SphereGeometry(4, 32, 32);
geometry.scale(-1, 1, 1);
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);
```

## Оптимізації для Raspberry Pi та 10 000 точок

- **Viewport підвантаження**: backend фільтрує `places` по `bbox`, frontend не завантажує всю базу.
- **Адаптивна деталізація**: при малому zoom не віддавати повні `visits`.
- **Дроселювання оновлень**: `refreshData` викликається по `moveend`, а не кожен `mousemove`.
- **Метаболи по гріду**: крок `gridSize` залежить від zoom, що контролює CPU-навантаження.
- **GPU heatmap**: тепловий шар MapLibre мінімізує роботу CPU.
- **Локальне кешування**: геокодинг кешується у JSON, знижуючи кількість запитів.

## Запуск

```bash
# backend
cd backend
npm install
npm run dev

# frontend
cd ../frontend
npm install
npm run dev
```
