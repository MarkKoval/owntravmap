import express from "express";
import { getPlaces } from "../services/store.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const places = await getPlaces();
  const visits = places.flatMap((place) => place.visits || []);

  const visitsByTag = visits.reduce((acc, visit) => {
    for (const tag of visit.tags || []) {
      acc[tag] = (acc[tag] || 0) + 1;
    }
    return acc;
  }, {});

  const visitsByMonth = visits.reduce((acc, visit) => {
    const month = visit.visitedAt.slice(0, 7);
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  res.json({
    totalPlaces: places.length,
    totalVisits: visits.length,
    visitsByTag,
    visitsByMonth
  });
});

export default router;
