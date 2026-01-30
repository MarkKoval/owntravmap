import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../data');
const photosDir = path.resolve(dataDir, 'photos');
const thumbnailsDir = path.resolve(dataDir, 'thumbnails');
const placesFile = path.resolve(dataDir, 'places.json');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const now = new Date();
    const dir = path.join(photosDir, now.getFullYear().toString(), String(now.getMonth() + 1).padStart(2, '0'));
    await fs.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({ storage });

async function readPlaces() {
  try {
    const raw = await fs.readFile(placesFile, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writePlaces(places) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(placesFile, JSON.stringify(places, null, 2));
}

function withinBbox(place, bbox) {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  return place.lng >= minLng && place.lng <= maxLng && place.lat >= minLat && place.lat <= maxLat;
}

app.get('/api/places', async (req, res) => {
  const { bbox } = req.query;
  const places = await readPlaces();
  if (!bbox) {
    return res.json(places);
  }
  const parsed = bbox.split(',').map(Number);
  if (parsed.length !== 4 || parsed.some(Number.isNaN)) {
    return res.status(400).json({ error: 'Invalid bbox' });
  }
  return res.json(places.filter((place) => withinBbox(place, parsed)));
});

app.post('/api/places', async (req, res) => {
  const { title, lat, lng, address = '', tags = [] } = req.body;
  if (!title || typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const places = await readPlaces();
  const place = {
    id: uuidv4(),
    title,
    lat,
    lng,
    address,
    tags,
    visitsCount: 0,
    visits: []
  };
  places.push(place);
  await writePlaces(places);
  return res.status(201).json(place);
});

app.delete('/api/places/:id', async (req, res) => {
  const { id } = req.params;
  const places = await readPlaces();
  const next = places.filter((place) => place.id !== id);
  if (next.length === places.length) {
    return res.status(404).json({ error: 'Not found' });
  }
  await writePlaces(next);
  return res.json({ ok: true });
});

app.post('/api/places/:id/visits', async (req, res) => {
  const { id } = req.params;
  const { at, rating, note = '', photos = [], tags = [] } = req.body;
  const places = await readPlaces();
  const place = places.find((item) => item.id === id);
  if (!place) {
    return res.status(404).json({ error: 'Not found' });
  }
  const visit = {
    id: uuidv4(),
    at: at || new Date().toISOString(),
    rating,
    note,
    photos,
    tags
  };
  place.visits.push(visit);
  place.visitsCount = place.visits.length;
  await writePlaces(places);
  return res.status(201).json(visit);
});

app.post('/api/upload', upload.array('photos'), async (req, res) => {
  const files = req.files || [];
  const payload = files.map((file) => ({
    path: path.relative(dataDir, file.path),
    filename: file.filename,
    originalname: file.originalname
  }));
  return res.json({ files: payload });
});

app.get('/api/stats', async (req, res) => {
  const places = await readPlaces();
  const totalVisits = places.reduce((sum, place) => sum + place.visits.length, 0);
  const topCities = [...places]
    .sort((a, b) => b.visits.length - a.visits.length)
    .slice(0, 5)
    .map((place) => ({ id: place.id, title: place.title, visits: place.visits.length }));
  return res.json({ totalVisits, placesCount: places.length, topCities });
});

app.get('/api/geocode', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Missing query' });
  }
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '8');
  url.searchParams.set('countrycodes', 'ua');
  url.searchParams.set('q', q);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'owntravmap/0.1 (local)'
    }
  });
  if (!response.ok) {
    return res.status(502).json({ error: 'Geocoding failed' });
  }
  const data = await response.json();
  return res.json(data);
});

app.use('/photos', express.static(photosDir));
app.use('/thumbnails', express.static(thumbnailsDir));

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
