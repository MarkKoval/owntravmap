import express from 'express';
import { v4 as uuid } from 'uuid';
import { ensureDataFile, readPlaces, writePlaces } from '../storage/placesStore.js';
import { inBBox, parseBBox } from '../utils/bbox.js';
import { getCache, setCache } from '../utils/cache.js';

const router = express.Router();

await ensureDataFile();

function summarizeByRegion(places) {
  const regions = new Map();
  for (const place of places) {
    const region = place.region || 'Невідомо';
    const entry = regions.get(region) || { region, visits: 0, places: 0 };
    entry.visits += place.visitsCount || 0;
    entry.places += 1;
    regions.set(region, entry);
  }
  return Array.from(regions.values());
}

router.get('/', async (req, res) => {
  const bbox = parseBBox(req.query.bbox);
  const zoom = Number(req.query.zoom ?? 0);
  const cacheKey = `places:${req.query.bbox || 'all'}:${zoom}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return res.json(cached);
  }
  const places = (await readPlaces()).filter((place) => inBBox(place, bbox));
  const payload = zoom < 6
    ? { mode: 'country', regions: summarizeByRegion(places), places }
    : { mode: 'detail', places };
  setCache(cacheKey, payload, 4000);
  res.json(payload);
});

router.post('/', async (req, res) => {
  const { title, lat, lng, address, tags = [], region } = req.body;
  if (!title || typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'title, lat, lng are required' });
  }
  const places = await readPlaces();
  const newPlace = {
    id: uuid(),
    title,
    lat,
    lng,
    address: address || '',
    tags,
    region: region || null,
    visitsCount: 0,
    visits: []
  };
  places.push(newPlace);
  await writePlaces(places);
  res.status(201).json(newPlace);
});

router.delete('/:id', async (req, res) => {
  const places = await readPlaces();
  const next = places.filter((place) => place.id !== req.params.id);
  await writePlaces(next);
  res.json({ ok: true });
});

router.post('/:id/visits', async (req, res) => {
  const { at, rating, note, photos = [] } = req.body;
  const places = await readPlaces();
  const place = places.find((item) => item.id === req.params.id);
  if (!place) {
    return res.status(404).json({ error: 'place not found' });
  }
  const visit = {
    id: uuid(),
    at: at || new Date().toISOString(),
    rating: Math.min(10, Math.max(1, Number(rating || 5))),
    note: note || '',
    photos
  };
  place.visits.push(visit);
  place.visitsCount = place.visits.length;
  await writePlaces(places);
  res.status(201).json(visit);
});

export default router;
