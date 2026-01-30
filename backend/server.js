import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import placesRouter from './routes/places.js';
import statsRouter from './routes/stats.js';
import uploadRouter from './routes/upload.js';
import geocodeRouter from './routes/geocode.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use('/api/places', placesRouter);
app.use('/api/stats', statsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/geocode', geocodeRouter);

app.use('/photos', express.static(path.join(__dirname, 'data', 'photos')));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
