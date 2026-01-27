import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

const REMOTE_UKRAINE_GEOJSON_URLS = [
  'https://raw.githubusercontent.com/johan/world.geo.json/master/countries/UKR.geo.json',
  'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'
];
const LOCAL_UKRAINE_GEOJSON_URL = '/assets/ukraine.geojson';
const UKRAINE_NAMES = new Set(['ukraine', 'ukr', 'ukraina']);
const REMOTE_TIMEOUT_MS = 6000;

let cachedUkraineGeojson = null;
let inFlightUkraineGeojson = null;

export async function loadUkraineGeojson() {
  if (cachedUkraineGeojson) {
    return cachedUkraineGeojson;
  }

  if (inFlightUkraineGeojson) {
    return inFlightUkraineGeojson;
  }

  inFlightUkraineGeojson = (async () => {
    const remoteGeojson = await loadRemoteUkraineGeojson();
    if (remoteGeojson) {
      cachedUkraineGeojson = remoteGeojson;
      return cachedUkraineGeojson;
    }

    const response = await fetch(LOCAL_UKRAINE_GEOJSON_URL);
    if (!response.ok) {
      throw new Error('Failed to load Ukraine geometry');
    }
    cachedUkraineGeojson = await response.json();
    return cachedUkraineGeojson;
  })();

  try {
    return await inFlightUkraineGeojson;
  } finally {
    inFlightUkraineGeojson = null;
  }
}

async function loadRemoteUkraineGeojson() {
  for (const url of REMOTE_UKRAINE_GEOJSON_URLS) {
    const response = await fetchWithTimeout(url, REMOTE_TIMEOUT_MS);
    if (!response?.ok) {
      continue;
    }
    const data = await response.json();
    const feature = extractUkraineFeature(data);
    if (feature) {
      return { type: 'FeatureCollection', features: [feature] };
    }
  }
  return null;
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    return null;
  } finally {
    globalThis.clearTimeout(timer);
  }
}

function extractUkraineFeature(data) {
  if (!data) return null;
  if (data.type === 'FeatureCollection') {
    if (data.features?.length === 1) {
      return data.features[0];
    }
    return data.features?.find((feature) => isUkraineFeature(feature)) ?? null;
  }
  if (data.type === 'Feature') {
    return isUkraineFeature(data) ? data : null;
  }
  return null;
}

function isUkraineFeature(feature) {
  if (!feature?.properties) return false;
  const values = [
    feature.properties.ADMIN,
    feature.properties.admin,
    feature.properties.NAME,
    feature.properties.name,
    feature.properties.ISO_A3,
    feature.properties.iso_a3
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  return values.some((value) => UKRAINE_NAMES.has(value));
}

export function getBounds(feature) {
  const coords = collectCoordinates(feature.geometry.coordinates);
  const lons = coords.map((coord) => coord[0]);
  const lats = coords.map((coord) => coord[1]);
  return [
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)]
  ];
}

export function isInUkraine(feature, lng, lat) {
  return booleanPointInPolygon([lng, lat], feature);
}

export function toGeoJson(points) {
  return {
    type: 'FeatureCollection',
    features: points.map((place) => ({
      type: 'Feature',
      properties: {
        id: place.id,
        title: place.title,
        count: 1,
        color: place.color,
        category: place.category,
        visitDate: place.visitDate,
        photos: place.photos,
        createdAt: place.createdAt
      },
      geometry: {
        type: 'Point',
        coordinates: [place.lng, place.lat]
      }
    }))
  };
}

function collectCoordinates(coordinates, collected = []) {
  if (!coordinates) return collected;
  if (typeof coordinates[0] === 'number') {
    collected.push(coordinates);
    return collected;
  }
  coordinates.forEach((entry) => collectCoordinates(entry, collected));
  return collected;
}
