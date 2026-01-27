import { describe, it, beforeEach, expect } from "vitest";
import request from "supertest";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createApp } from "../app.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFile = path.join(__dirname, "..", "data", "places.json");

async function seedPlaces(places) {
  await fs.writeFile(dataFile, JSON.stringify(places, null, 2));
}

describe("places API", () => {
  let app;

  beforeEach(async () => {
    await seedPlaces([]);
    app = await createApp();
  });

  it("accepts a point inside Ukraine", async () => {
    const response = await request(app)
      .post("/api/places")
      .send({ lat: 50.4501, lng: 30.5234, source: "click" })
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.lat).toBe(50.4501);
  });

  it("rejects a point outside Ukraine", async () => {
    await request(app)
      .post("/api/places")
      .send({ lat: 52.2297, lng: 21.0122 })
      .expect(400);
  });

  it("filters by date range", async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    await seedPlaces([
      {
        id: "1",
        lat: 50.45,
        lng: 30.523,
        createdAt: yesterday.toISOString(),
        title: "",
        note: "",
        source: "click"
      }
    ]);

    const response = await request(app)
      .get(`/api/places?from=${now.toISOString()}`)
      .expect(200);

    expect(response.body).toHaveLength(0);
  });
});
