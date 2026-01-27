import fs from "node:fs/promises";
import path from "node:path";

const ukrainePath = path.resolve("assets/ukraine.geojson");

export async function loadUkraineGeojson() {
  const raw = await fs.readFile(ukrainePath, "utf-8");
  return JSON.parse(raw);
}
