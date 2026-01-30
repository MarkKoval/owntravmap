import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.resolve("./backend/data");
const PLACES_FILE = path.join(DATA_DIR, "places.json");
let cache = null;
let writePromise = Promise.resolve();

async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(PLACES_FILE);
  } catch {
    await fs.writeFile(PLACES_FILE, JSON.stringify({ places: [] }, null, 2));
  }
}

async function load() {
  if (cache) return cache;
  await ensureFile();
  const raw = await fs.readFile(PLACES_FILE, "utf-8");
  cache = JSON.parse(raw);
  return cache;
}

function queueWrite(data) {
  writePromise = writePromise.then(() =>
    fs.writeFile(PLACES_FILE, JSON.stringify(data, null, 2))
  );
  return writePromise;
}

export async function getPlaces() {
  const data = await load();
  return data.places;
}

export async function savePlaces(places) {
  cache = { places };
  await queueWrite(cache);
  return places;
}

export async function updatePlace(id, updater) {
  const places = await getPlaces();
  const idx = places.findIndex((place) => place.id === id);
  if (idx === -1) return null;
  const updated = updater(places[idx]);
  places[idx] = updated;
  await savePlaces(places);
  return updated;
}

export async function addPlace(place) {
  const places = await getPlaces();
  places.push(place);
  await savePlaces(places);
  return place;
}

export async function removePlace(id) {
  const places = await getPlaces();
  const next = places.filter((place) => place.id !== id);
  if (next.length === places.length) return false;
  await savePlaces(next);
  return true;
}

export async function replacePlaces(nextPlaces) {
  await savePlaces(nextPlaces);
  return nextPlaces;
}
