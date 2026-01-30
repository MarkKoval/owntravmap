import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '..', 'data', 'places.json');

let cached = null;
let lastRead = 0;

export async function readPlaces() {
  const now = Date.now();
  if (cached && now - lastRead < 2000) {
    return cached;
  }
  const raw = await fs.readFile(dataPath, 'utf-8');
  cached = JSON.parse(raw || '[]');
  lastRead = now;
  return cached;
}

export async function writePlaces(places) {
  cached = places;
  lastRead = Date.now();
  await fs.writeFile(dataPath, JSON.stringify(places, null, 2));
}

export async function ensureDataFile() {
  try {
    await fs.access(dataPath);
  } catch {
    await fs.mkdir(path.dirname(dataPath), { recursive: true });
    await fs.writeFile(dataPath, '[]');
  }
}
