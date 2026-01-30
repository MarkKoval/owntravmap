import express from "express";
import { nanoid } from "nanoid";
import { addPlace, getPlaces, removePlace, updatePlace } from "../services/store.js";
import { isPointInBBox, parseBBox } from "../utils/geo.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const bbox = parseBBox(req.query.bbox);
  const zoom = Number(req.query.zoom || 6);
  const places = await getPlaces();

  const filtered = places
    .filter((place) => isPointInBBox(place.coordinates, bbox))
    .map((place) => ({
      ...place,
      visits:
        zoom < 9
          ? []
          : place.visits
    }));

  res.json({ places: filtered });
});

router.post("/", async (req, res) => {
  const { name, coordinates, address, tags = [] } = req.body;
  if (!name || !coordinates) {
    return res.status(400).json({ error: "Name and coordinates required" });
  }

  const newPlace = {
    id: nanoid(),
    name,
    coordinates,
    address: address || "",
    tags,
    visitsCount: 0,
    visits: []
  };

  await addPlace(newPlace);
  res.status(201).json(newPlace);
});

router.post("/:id/visits", async (req, res) => {
  const { id } = req.params;
  const { visitedAt, rating, note, tags = [], photos = [] } = req.body;

  const updated = await updatePlace(id, (place) => {
    const visits = place.visits ?? [];
    const visit = {
      id: nanoid(),
      visitedAt: visitedAt || new Date().toISOString(),
      rating: Number(rating || 5),
      note: note || "",
      tags,
      photos
    };
    return {
      ...place,
      tags: Array.from(new Set([...(place.tags || []), ...tags])),
      visits: [...visits, visit],
      visitsCount: (place.visitsCount || 0) + 1
    };
  });

  if (!updated) {
    return res.status(404).json({ error: "Place not found" });
  }

  res.status(201).json(updated);
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, address, tags, visits } = req.body;

  const updated = await updatePlace(id, (place) => ({
    ...place,
    name: name ?? place.name,
    address: address ?? place.address,
    tags: tags ?? place.tags,
    visits: visits ?? place.visits
  }));

  if (!updated) {
    return res.status(404).json({ error: "Place not found" });
  }

  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const removed = await removePlace(req.params.id);
  if (!removed) {
    return res.status(404).json({ error: "Place not found" });
  }
  res.status(204).end();
});

export default router;
