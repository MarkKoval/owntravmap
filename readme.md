# Visited Ukraine Map

Production-ready monorepo for the **Visited Ukraine Map** application.

## Structure

```
/assets
  ukraine.geojson
/backend
/frontend
```

## Requirements

- Node.js 18+
- npm 9+

## Setup

```bash
npm install
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

### Environment variables

Frontend (`frontend/.env`):

- `VITE_API_BASE` – backend base URL.
- `VITE_MAPTILER_KEY` – optional MapTiler key for satellite/labels styles.
- `VITE_MAP_STYLE` – optional satellite style URL.
- `VITE_LABELS_STYLE` – optional labels style URL.
- `VITE_GEOCODER_URL` – Photon/Nominatim endpoint.

Backend (`backend/.env`):

- `PORT` – backend port (default 5179).
- `DATA_FILE` – storage location for places JSON.

## Development

```bash
npm run dev
```

## Tests

```bash
npm run test
npm run e2e
```

## Backups

Manual backup:

```bash
npm run backup
```

The backend also runs weekly backups (Sunday 03:00). For a system cron alternative:

```
0 3 * * 0 /usr/bin/node /path/to/repo/backend/src/backup.js
```

## Attributions

- Satellite imagery (fallback): Esri World Imagery.
- Labels overlay (fallback): OpenStreetMap contributors via CARTO.
- Geocoder: Photon by Komoot (configurable).

## Notes

- The UI enforces Ukraine-only map bounds and applies an outside mask.
- The backend validates coordinates against the Ukraine polygon stored in `/assets/ukraine.geojson`.
