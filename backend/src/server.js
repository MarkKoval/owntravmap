import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import placesRouter from "./routes/places.js";
import uploadsRouter from "./routes/uploads.js";
import statsRouter from "./routes/stats.js";
import geocodeRouter from "./routes/geocode.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/photos", express.static(path.join(__dirname, "../data/photos")));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use("/api/places", placesRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/stats", statsRouter);
app.use("/api/geocode", geocodeRouter);

const port = process.env.PORT || 5179;
app.listen(port, () => {
  console.log(`OwnTravMap backend running on :${port}`);
});
