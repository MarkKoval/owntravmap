import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { readPlaces, writePlaces } from './storage.js';
import { isPointInUkraine } from './validation.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/places', async (req, res) => {
    const places = await readPlaces();
    const { from, to } = req.query;
    let filtered = places;
    if (from) {
      const fromDate = new Date(from);
      filtered = filtered.filter((place) => getPlaceDate(place) >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      filtered = filtered.filter((place) => getPlaceDate(place) <= toDate);
    }
    res.json(filtered);
  });

  app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
      return res.json({ features: [] });
    }
    const url = new URL('https://photon.komoot.io/api/');
    url.searchParams.set('q', query);
    url.searchParams.set('limit', '6');
    url.searchParams.set('lang', 'uk');
    url.searchParams.set('bbox', '22.1,44.3,41.9,52.5');
    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        return res.status(502).json({ message: 'Search failed' });
      }
      const data = await response.json();
      return res.json(data);
    } catch (error) {
      return res.status(502).json({ message: 'Search failed' });
    }
  });

  app.post('/api/places', async (req, res) => {
    const { lat, lng, title, note, source, visitDate, color, category, photos } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'lat and lng are required' });
    }
    const within = await isPointInUkraine(Number(lng), Number(lat));
    if (!within) {
      return res.status(400).json({ message: 'Point is outside Ukraine' });
    }

    const places = await readPlaces();
    const newPlace = {
      id: uuidv4(),
      lat: Number(lat),
      lng: Number(lng),
      createdAt: new Date().toISOString(),
      visitDate: visitDate || new Date().toISOString().slice(0, 10),
      title: title || '',
      note: note || '',
      color: color || '#38bdf8',
      category: category || 'regular',
      photos: Array.isArray(photos) ? photos : [],
      source: source === 'search' ? 'search' : 'click'
    };
    places.push(newPlace);
    await writePlaces(places);
    res.status(201).json(newPlace);
  });

  app.put('/api/places/:id', async (req, res) => {
    const { title, note, visitDate, color, category, photos } = req.body;
    const places = await readPlaces();
    const target = places.find((place) => place.id === req.params.id);
    if (!target) {
      return res.status(404).json({ message: 'Not found' });
    }
    target.title = title ?? target.title;
    target.note = note ?? target.note;
    target.visitDate = visitDate || target.visitDate || new Date().toISOString().slice(0, 10);
    target.color = color || target.color || '#38bdf8';
    target.category = category || target.category || 'regular';
    target.photos = Array.isArray(photos) ? photos : target.photos || [];
    await writePlaces(places);
    res.json(target);
  });

  app.delete('/api/places/:id', async (req, res) => {
    const places = await readPlaces();
    const index = places.findIndex((place) => place.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Not found' });
    }
    const [removed] = places.splice(index, 1);
    await writePlaces(places);
    res.json(removed);
  });

  return app;
}

function getPlaceDate(place) {
  if (place.visitDate) {
    return new Date(`${place.visitDate}T00:00:00Z`);
  }
  return new Date(place.createdAt);
}
