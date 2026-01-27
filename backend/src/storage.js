import fs from "node:fs/promises";
import path from "node:path";

const dataPath = path.resolve("backend/data/places.json");

export async function ensureDataFile() {
  try {
    await fs.access(dataPath);
  } catch {
    await fs.mkdir(path.dirname(dataPath), { recursive: true });
    await fs.writeFile(dataPath, "[]", "utf-8");
  }
}

export async function readPlaces() {
  await ensureDataFile();
  const raw = await fs.readFile(dataPath, "utf-8");
  return JSON.parse(raw);
}

export async function writePlaces(places) {
  await ensureDataFile();
  const tmpPath = `${dataPath}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(places, null, 2));
  await fs.rename(tmpPath, dataPath);
}

export function getDataPath() {
  return dataPath;
}
