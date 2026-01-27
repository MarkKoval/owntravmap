import { promises as fs } from 'fs';
import path from 'path';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

const ROOT_ASSETS_PATH = path.resolve(process.cwd(), 'assets/ukraine.geojson');
const BACKEND_ASSETS_PATH = path.resolve(process.cwd(), '../assets/ukraine.geojson');
let cachedPolygon = null;

async function loadUkrainePolygon() {
  if (cachedPolygon) {
    return cachedPolygon;
  }
  let raw;
  try {
    raw = await fs.readFile(ROOT_ASSETS_PATH, 'utf-8');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
    raw = await fs.readFile(BACKEND_ASSETS_PATH, 'utf-8');
  }
  const geojson = JSON.parse(raw);
  const feature = geojson.features?.[0];
  if (!feature) {
    throw new Error('Ukraine polygon not found');
  }
  cachedPolygon = feature;
  return cachedPolygon;
}

export async function isPointInUkraine(lng, lat) {
  const polygon = await loadUkrainePolygon();
  return booleanPointInPolygon([lng, lat], polygon);
}

export async function getUkraineBounds() {
  const polygon = await loadUkrainePolygon();
  const coordinates = polygon.geometry.coordinates[0];
  const lons = coordinates.map((coord) => coord[0]);
  const lats = coordinates.map((coord) => coord[1]);
  return {
    minLng: Math.min(...lons),
    maxLng: Math.max(...lons),
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats)
  };
}
