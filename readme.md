# Visited Ukraine Map

Production-ready monorepo for tracking visited places in Ukraine with a satellite-only, masked MapLibre map, heatmap visualization, and animated UX.

## Stack
- **Frontend:** React + Vite, MapLibre GL JS, Framer Motion
- **Backend:** Node.js + Express
- **Storage:** JSON file with weekly backups + rotation
- **Testing:** Vitest (frontend + backend), Playwright (E2E)

## Project structure
```
/assets               Shared Ukraine polygon
/backend              Express API + backup scheduler
/frontend             React + Vite app
/e2e                  Playwright tests
```

## Setup
```bash
npm install
```

Create environment files:
```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

## Development
```bash
npm run dev
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

## Tests
```bash
npm run test
npm run e2e
```

## Manual backup
```bash
npm run backup
```

## Backups and rotation
- Weekly cron runs every Monday at 03:00 server time.
- Backups stored in `backend/backups/` with `places-YYYY-MM-DD.json` naming.
- Keeps the most recent 8 backups and deletes older ones.

To use system cron instead, add:
```
0 3 * * 1 cd /path/to/visited-ukraine-map && npm run backup
```

## Map and geocoding attribution
- Satellite imagery: Esri World Imagery
- Labels: OpenStreetMap raster tiles
- Geocoding: Photon (Komoot)

## API
- `GET /api/places?from=ISO&to=ISO`
- `POST /api/places` `{ lat, lng, title?, note?, source }`
- `DELETE /api/places/:id`

## Notes
- The map view is clamped and masked to Ukraine using `assets/ukraine.geojson`.
- The backend validates every point with a point-in-polygon check.
