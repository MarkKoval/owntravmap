import { promises as fs } from 'fs';
import path from 'path';

const DATA_PATH = path.resolve('backend/data/places.json');

export async function readPlaces() {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function writePlaces(places) {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  const tempPath = `${DATA_PATH}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(places, null, 2));
  await fs.rename(tempPath, DATA_PATH);
}

export function getDataPath() {
  return DATA_PATH;
}
