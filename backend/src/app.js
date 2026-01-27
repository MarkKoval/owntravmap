import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { v4 as uuid } from "uuid";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import { readPlaces, writePlaces, ensureDataFile } from "./storage.js";
import { loadUkraineGeojson } from "./ukraine.js";

dotenv.config();

export async function createApp() {
  await ensureDataFile();
  const ukraineGeojson = await loadUkraineGeojson();
  const ukraineFeature = ukraineGeojson.features[0];

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/places", async (req, res) => {
    const { from, to } = req.query;
    const places = await readPlaces();
    const filtered = places.filter((place) => {
      const createdAt = new Date(place.createdAt).getTime();
      if (from && createdAt < new Date(from).getTime()) {
        return false;
      }
      if (to && createdAt > new Date(to).getTime()) {
        return false;
      }
      return true;
    });
    res.json(filtered);
  });

  app.post("/api/places", async (req, res) => {
    const { lat, lng, title, note, source } = req.body;
    if (typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({ message: "lat and lng are required" });
    }
    const withinUkraine = booleanPointInPolygon(point([lng, lat]), ukraineFeature);
    if (!withinUkraine) {
      return res.status(400).json({ message: "Point is outside Ukraine" });
    }

    const places = await readPlaces();
    const newPlace = {
      id: uuid(),
      lat,
      lng,
      createdAt: new Date().toISOString(),
      title: title ?? "",
      note: note ?? "",
      source: source === "search" ? "search" : "click",
    };
    places.push(newPlace);
    await writePlaces(places);
    res.status(201).json(newPlace);
  });

  app.delete("/api/places/:id", async (req, res) => {
    const { id } = req.params;
    const places = await readPlaces();
    const next = places.filter((place) => place.id !== id);
    if (next.length === places.length) {
      return res.status(404).json({ message: "Not found" });
    }
    await writePlaces(next);
    res.status(204).send();
  });

  return app;
}
