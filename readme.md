# Visited Ukraine Map

Premium, satellite-first map to track visited places across Ukraine with heatmaps, timeline, and animated UI.

## Stack
- **Frontend:** React + Vite + MapLibre GL JS + Framer Motion
- **Backend:** Node.js + Express
- **Storage:** JSON file with weekly rotating backups
- **Testing:** Vitest (unit/integration), Supertest (backend), Playwright (E2E)

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
- Backend: http://localhost:4000

## Tests
```bash
npm run test
npm run e2e
```

## Backups
Weekly backups run every Sunday at 03:00 server time via node-cron. Manual backup:
```bash
npm run backup
```
Backups are stored in `backend/backups/` with rotation (last 8 kept). To run with system cron, invoke `npm run backup` on your preferred schedule.

## Map Attributions
- Satellite Imagery: Esri World Imagery
- Labels: OpenStreetMap contributors, © CARTO
- Geocoding: Photon (Komoot)

## Notes
- Backend rejects points outside Ukraine via point-in-polygon validation.
- Client masks outside Ukraine and constrains camera bounds.
