# OwnTravMap — карта відвіданих місць України

## 1) Архітектура
**Frontend (Vite + MapLibre + Three.js)**
- Відображає карту, heatmap, metaballs та кластери, керує bottom sheet і модалками.
- Стан підтягується через REST API (`/api/places`, `/api/stats`, `/api/geocode`).
- 3D сфера — окрема модалка з Three.js.

**Backend (Node.js + Express + JSON storage)**
- Зберігає `places.json`, фото у `/data/photos`.
- API повертає фільтровані точки у bbox, статистику, приймає нові візити і файли.

**Потік даних**
1. Frontend запитує `/api/places?bbox&zoom`.
2. Backend фільтрує місця та віддає їх (або агрегує за областями для масштабу країни).
3. Frontend рендерить heatmap, metaballs і кластери.
4. `/api/stats` формує дашборд (області, топ міста, теги, місячна динаміка).

## 2) Структура папок
```
/owntravmap
  /backend
    /data
    /routes
    /storage
    /utils
  /frontend
    /src
      /components
      /map
      /three
      /utils
```

## 3) Ключові компоненти карти
- **MapLibre карта** з heatmap і кластеризацією. `frontend/src/map/map.js`. 
- **Heatmap** як GPU-шар MapLibre. `frontend/src/map/heatmapLayer.js`.
- **Metaballs** поверх карти (canvas overlay). `frontend/src/map/metaballs.js`.
- **3D photo sphere** у модальному вікні. `frontend/src/three/photoSphere.js`.

## 4) Реалізація metaball-логіки
- Вага: `log(1 + visitsCount)`.
- Радіус росте з зумом.
- Поле обчислюється на сітці 60×60, поріг та kernel підбираються так, щоб не заливати карту.
- Marching Squares — побудова контуру + напівпрозора заливка.

Реалізація в `frontend/src/map/metaballs.js`:
```js
const points = features.map((feature) => ({
  weight: Math.log1p(feature.properties.visitsCount || 1),
  radiusScale: Math.max(0.6, Math.min(1.6, (zoom - 5) / 6))
}));
```

## 5) API-ендпоїнти
- `GET /api/places?bbox=&zoom=` — повертає точки або агреговані області.
- `POST /api/places` — створення місця.
- `DELETE /api/places/:id` — видалення місця.
- `POST /api/places/:id/visits` — новий візит.
- `POST /api/upload` — завантаження фото.
- `GET /api/stats` — статистика.
- `GET /api/geocode?q=` — proxy до геокодингу (обмеження України).

## 6) Приклади коду

### Карта (MapLibre + кластери)
```js
map.addSource('places', {
  type: 'geojson',
  data: { type: 'FeatureCollection', features: [] },
  cluster: true,
  clusterRadius: 40
});
```

### Heatmap
```js
'heatmap-color': [
  'interpolate', ['linear'], ['heatmap-density'],
  0, 'rgba(44, 98, 255, 0)',
  0.9, 'rgba(248, 85, 85, 0.8)'
]
```

### Metaballs (marching squares)
```js
const grid = computeField(points, canvas.width, canvas.height, radius, threshold);
ctx.strokeStyle = 'rgba(122, 214, 255, 0.9)';
drawContours(ctx, grid);
```

### 3D сфера з фото
```js
const geometry = new THREE.SphereGeometry(6, 32, 32);
geometry.scale(-1, 1, 1);
```

## 7) Оптимізації під 10k точок
1. **BBox-фільтрація** на бекенді для зменшення обсягу даних.
2. **Кешування** запитів `/api/places` та `/api/geocode` на 2–60 сек.
3. **GPU heatmap** (MapLibre), що відмальовує на відеокарті.
4. **Metaballs** лише в певному зумі (6–12), і сітка 60×60.
5. **Кластери** на рівні міста/району замість рендеру 10k точок.
6. **Lazy loading** фото та обмеження текстур у 3D сфері (до 40).

## Запуск
```bash
npm install
npm run dev
```

## Налаштування Raspberry Pi 4
- Використати Node.js 18+.
- Встановити `pm2` або systemd для автозапуску backend.
- Зберігати `/backend/data/photos` на SSD або USB для швидкого читання.
