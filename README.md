# Visited Ukraine Map

Premium, animated mapping experience for tracking visits inside Ukraine. Built with React + Vite, MapLibre GL, and an Express backend that persists to JSON with weekly backups.

## Requirements

- Node.js 18+
- npm

## Setup

```bash
npm install
```

Copy environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

## Development

Run the full stack locally:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:4000`.

## Production build

```bash
npm run build --workspace frontend
npm run start --workspace backend
```

## Backups

A weekly backup runs every Sunday at 03:00 server time via `node-cron`. Manual backup:

```bash
npm run backup
```

Rotation keeps the last 8 files in `backend/backups/`.

If you prefer system cron, you can run:

```bash
0 3 * * 0 cd /path/to/visited-ukraine-map && npm run backup
```

## Testing

```bash
npm run test
```

E2E:

```bash
npm run e2e
```

## Map attributions

- Satellite imagery: Esri World Imagery
- Labels: Stadia Maps + OpenStreetMap contributors
- Geocoding: Photon (Komoot)

## Project structure

```
assets/ukraine.geojson
backend/
frontend/
```

## Notes

- The map view is locked to Ukraine with an outside mask.
- Backend rejects points outside the Ukraine polygon.
- Heatmap and clustering use MapLibre WebGL layers for 10k+ points.
