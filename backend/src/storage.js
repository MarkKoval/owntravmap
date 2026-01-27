import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = process.env.DATA_FILE
  ? path.resolve(process.env.DATA_FILE)
  : path.resolve(__dirname, '..', 'data', 'places.json');

export const ensureDataFile = () => {
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify([]));
  }
};

export const readPlaces = () => {
  ensureDataFile();
  const raw = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(raw);
};

export const writePlaces = (places) => {
  ensureDataFile();
  const tempPath = `${dataPath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(places, null, 2));
  fs.renameSync(tempPath, dataPath);
};

export const getDataPath = () => dataPath;
