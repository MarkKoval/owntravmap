import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataFile = path.join(__dirname, "data", "places.json");
const ukraineFile = path.join(__dirname, "..", "assets", "ukraine.geojson");

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

async function writeJsonAtomic(filePath, data) {
  const tempPath = `${filePath}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
  await fs.rename(tempPath, filePath);
}

async function ensureDataFile() {
  try {
    await fs.access(dataFile);
  } catch {
    await writeJsonAtomic(dataFile, []);
  }
}

export async function createApp() {
  await ensureDataFile();
  const ukraineGeojson = await readJson(ukraineFile);

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/places", async (req, res) => {
    try {
      const { from, to } = req.query;
      const places = await readJson(dataFile);
      const fromDate = from ? new Date(from) : null;
      const toDate = to ? new Date(to) : null;
      const filtered = places.filter((place) => {
        const createdAt = new Date(place.createdAt);
        if (fromDate && Number.isNaN(fromDate.valueOf())) return false;
        if (toDate && Number.isNaN(toDate.valueOf())) return false;
        if (fromDate && createdAt < fromDate) return false;
        if (toDate && createdAt > toDate) return false;
        return true;
      });
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ message: "Failed to load places." });
    }
  });

  app.post("/api/places", async (req, res) => {
    try {
      const { lat, lng, title, note, source } = req.body || {};
      if (typeof lat !== "number" || typeof lng !== "number") {
        return res.status(400).json({ message: "lat and lng are required numbers." });
      }
      const point = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lng, lat]
        }
      };
      const inside = booleanPointInPolygon(point, ukraineGeojson.features[0]);
      if (!inside) {
        return res.status(400).json({ message: "Point must be inside Ukraine." });
      }
      const places = await readJson(dataFile);
      const createdAt = new Date().toISOString();
      const newPlace = {
        id: uuidv4(),
        lat,
        lng,
        createdAt,
        title: title || "",
        note: note || "",
        source: source === "search" ? "search" : "click"
      };
      const updated = [...places, newPlace];
      await writeJsonAtomic(dataFile, updated);
      res.status(201).json(newPlace);
    } catch (error) {
      res.status(500).json({ message: "Failed to save place." });
    }
  });

  app.delete("/api/places/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const places = await readJson(dataFile);
      const updated = places.filter((place) => place.id !== id);
      if (updated.length === places.length) {
        return res.status(404).json({ message: "Place not found." });
      }
      await writeJsonAtomic(dataFile, updated);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete place." });
    }
  });

  return app;
}
