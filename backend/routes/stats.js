import express from 'express';
import { readPlaces } from '../storage/placesStore.js';

const router = express.Router();

function getCity(place) {
  if (place.city) return place.city;
  if (!place.address) return 'Невідомо';
  const parts = place.address.split(',').map((part) => part.trim());
  return parts[1] || parts[0] || 'Невідомо';
}

router.get('/', async (req, res) => {
  const places = await readPlaces();
  const totalVisits = places.reduce((acc, place) => acc + (place.visitsCount || 0), 0);
  const regions = new Map();
  const cities = new Map();
  const tags = new Map();
  const monthly = new Map();

  for (const place of places) {
    const region = place.region || 'Невідомо';
    const regionEntry = regions.get(region) || { region, visits: 0 };
    regionEntry.visits += place.visitsCount || 0;
    regions.set(region, regionEntry);

    const city = getCity(place);
    const cityEntry = cities.get(city) || { city, visits: 0 };
    cityEntry.visits += place.visitsCount || 0;
    cities.set(city, cityEntry);

    for (const tag of place.tags || []) {
      const tagEntry = tags.get(tag) || { tag, visits: 0 };
      tagEntry.visits += place.visitsCount || 0;
      tags.set(tag, tagEntry);
    }

    for (const visit of place.visits || []) {
      const date = new Date(visit.at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthly.set(key, (monthly.get(key) || 0) + 1);
    }
  }

  const regionsStats = Array.from(regions.values()).map((entry) => ({
    ...entry,
    percent: totalVisits ? Math.round((entry.visits / totalVisits) * 100) : 0
  }));

  res.json({
    totalVisits,
    regions: regionsStats,
    topCities: Array.from(cities.values()).sort((a, b) => b.visits - a.visits).slice(0, 6),
    topTags: Array.from(tags.values()).sort((a, b) => b.visits - a.visits).slice(0, 8),
    monthly: Array.from(monthly.entries()).map(([month, visits]) => ({ month, visits }))
  });
});

export default router;
