import { promises as fs } from 'fs';
import path from 'path';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

const ROOT_ASSETS_PATH = path.resolve(process.cwd(), 'assets/ukraine.geojson');
const BACKEND_ASSETS_PATH = path.resolve(process.cwd(), '../assets/ukraine.geojson');
const REMOTE_UKRAINE_GEOJSON_URLS = [
  'https://raw.githubusercontent.com/johan/world.geo.json/master/countries/UKR.geo.json',
  'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'
];
const UKRAINE_NAMES = new Set(['ukraine', 'ukr', 'ukraina']);
const REMOTE_TIMEOUT_MS = 6000;
let cachedPolygon = null;

async function loadUkrainePolygon() {
  if (cachedPolygon) {
    return cachedPolygon;
  }
  const remotePolygon = await loadRemoteUkrainePolygon();
  if (remotePolygon) {
    cachedPolygon = remotePolygon;
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

async function loadRemoteUkrainePolygon() {
  for (const url of REMOTE_UKRAINE_GEOJSON_URLS) {
    const response = await fetchWithTimeout(url, REMOTE_TIMEOUT_MS);
    if (!response?.ok) {
      continue;
    }
    const data = await response.json();
    const feature = extractUkraineFeature(data);
    if (feature) {
      return feature;
    }
  }
  return null;
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    return null;
  } finally {
    clearTimeout(timer);
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

export async function isPointInUkraine(lng, lat) {
  const polygon = await loadUkrainePolygon();
  return booleanPointInPolygon([lng, lat], polygon);
}

export async function getUkraineBounds() {
  const polygon = await loadUkrainePolygon();
  const coordinates = collectCoordinates(polygon.geometry.coordinates);
  const lons = coordinates.map((coord) => coord[0]);
  const lats = coordinates.map((coord) => coord[1]);
  return {
    minLng: Math.min(...lons),
    maxLng: Math.max(...lons),
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats)
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
