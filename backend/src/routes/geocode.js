import express from "express";
import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";

const router = express.Router();
const CACHE_FILE = path.resolve("./backend/data/geocode-cache.json");
const GEOCODE_URL = "https://nominatim.openstreetmap.org/search";

async function loadCache() {
  try {
    const raw = await fs.readFile(CACHE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function saveCache(cache) {
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
}

router.get("/", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Query required" });

  const cache = await loadCache();
  if (cache[query]) return res.json(cache[query]);

  const url = new URL(GEOCODE_URL);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "5");
  url.searchParams.set("q", `${query}, Ukraine`);

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "owntravmap/1.0"
    }
  });

  if (!response.ok) {
    return res.status(502).json({ error: "Geocoding failed" });
  }

  const data = await response.json();
  const result = data.map((item) => ({
    name: item.display_name,
    lat: Number(item.lat),
    lon: Number(item.lon)
  }));

  cache[query] = result;
  await saveCache(cache);

  res.json(result);
});

export default router;
