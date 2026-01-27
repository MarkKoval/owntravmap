import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const geoPath = path.resolve(__dirname, '..', '..', 'assets', 'ukraine.geojson');

export const loadUkraineGeojson = () => {
  const raw = fs.readFileSync(geoPath, 'utf-8');
  return JSON.parse(raw);
};
