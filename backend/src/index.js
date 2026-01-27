import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { fileURLToPath } from 'url';
import { readPlaces, writePlaces } from './storage.js';
import { loadUkraineGeojson } from './ukraine.js';
import { runBackup } from './backup.js';

const app = express();
const port = process.env.PORT || 5179;
const ukraineGeojson = loadUkraineGeojson();

app.use(cors());
app.use(express.json());

const isInsideUkraine = (lat, lng) => {
  const point = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [lng, lat]
    }
  };
  return booleanPointInPolygon(point, ukraineGeojson.features[0]);
};

app.get('/api/places', (req, res) => {
  const { from, to } = req.query;
  const places = readPlaces();
  const filtered = places.filter((place) => {
    const createdAt = new Date(place.createdAt).getTime();
    const fromTime = from ? new Date(from).getTime() : null;
    const toTime = to ? new Date(to).getTime() : null;
    if (Number.isNaN(createdAt)) {
      return false;
    }
    if (fromTime && createdAt < fromTime) return false;
    if (toTime && createdAt > toTime) return false;
    return true;
  });
  res.json(filtered);
});

app.post('/api/places', (req, res) => {
  const { lat, lng, title, note, source } = req.body;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ message: 'lat and lng required' });
  }
  if (!isInsideUkraine(lat, lng)) {
    return res.status(400).json({ message: 'Point outside Ukraine' });
  }
  const newPlace = {
    id: uuidv4(),
    lat,
    lng,
    title: title || '',
    note: note || '',
    source: source === 'search' ? 'search' : 'click',
    createdAt: new Date().toISOString()
  };
  const places = readPlaces();
  places.push(newPlace);
  writePlaces(places);
  return res.status(201).json(newPlace);
});

app.delete('/api/places/:id', (req, res) => {
  const { id } = req.params;
  const places = readPlaces();
  const next = places.filter((place) => place.id !== id);
  if (next.length === places.length) {
    return res.status(404).json({ message: 'Not found' });
  }
  writePlaces(next);
  return res.status(204).send();
});

cron.schedule('0 3 * * 0', () => {
  runBackup();
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(port, () => {
    console.log(`Backend listening on ${port}`);
  });
}

export default app;
