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
      filtered = filtered.filter((place) => new Date(place.createdAt) >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      filtered = filtered.filter((place) => new Date(place.createdAt) <= toDate);
    }
    res.json(filtered);
  });

  app.post('/api/places', async (req, res) => {
    const { lat, lng, title, note, source } = req.body;
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
      title: title || '',
      note: note || '',
      source: source === 'search' ? 'search' : 'click'
    };
    places.push(newPlace);
    await writePlaces(places);
    res.status(201).json(newPlace);
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
