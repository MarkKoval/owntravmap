import express from 'express';
import fetch from 'node-fetch';
import { getCache, setCache } from '../utils/cache.js';

const router = express.Router();
const UA_VIEWBOX = '22.1,52.4,40.2,44.3';

router.get('/', async (req, res) => {
  const query = String(req.query.q || '').trim();
  if (!query) {
    return res.status(400).json({ error: 'q is required' });
  }
  const cacheKey = `geocode:${query}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return res.json(cached);
  }
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '8');
  url.searchParams.set('viewbox', UA_VIEWBOX);
  url.searchParams.set('bounded', '1');
  url.searchParams.set('addressdetails', '1');

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'owntravmap/1.0'
    }
  });
  const data = await response.json();
  const payload = data.map((item) => ({
    title: item.display_name,
    lat: Number(item.lat),
    lng: Number(item.lon),
    address: item.display_name,
    city: item.address?.city || item.address?.town || item.address?.village || null,
    region: item.address?.state || null
  }));
  setCache(cacheKey, payload, 60000);
  res.json(payload);
});

export default router;
