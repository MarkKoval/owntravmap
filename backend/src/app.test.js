import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import fs from "node:fs/promises";
import path from "node:path";
import { createApp } from "./app.js";
import { writePlaces, readPlaces } from "./storage.js";
import { runBackup } from "./backup.js";

const backupsDir = path.resolve("backend/backups");

beforeEach(async () => {
  await writePlaces([]);
  await fs.mkdir(backupsDir, { recursive: true });
  const files = await fs.readdir(backupsDir);
  await Promise.all(files.map((file) => fs.unlink(path.join(backupsDir, file))));
});

describe("places API", () => {
  it("accepts a point inside Ukraine", async () => {
    const app = await createApp();
    const response = await request(app)
      .post("/api/places")
      .send({ lat: 50.4501, lng: 30.5234, title: "Kyiv" })
      .expect(201);

    expect(response.body.title).toBe("Kyiv");
    const places = await readPlaces();
    expect(places).toHaveLength(1);
  });

  it("rejects a point outside Ukraine", async () => {
    const app = await createApp();
    await request(app)
      .post("/api/places")
      .send({ lat: 52.2297, lng: 21.0122 })
      .expect(400);

    const places = await readPlaces();
    expect(places).toHaveLength(0);
  });

  it("filters places by date range", async () => {
    const app = await createApp();
    const now = new Date();
    await writePlaces([
      {
        id: "one",
        lat: 50.45,
        lng: 30.52,
        createdAt: new Date(now.getTime() - 86400000).toISOString(),
        title: "Yesterday",
        note: "",
        source: "click",
      },
      {
        id: "two",
        lat: 49.84,
        lng: 24.03,
        createdAt: now.toISOString(),
        title: "Today",
        note: "",
        source: "search",
      },
    ]);

    const response = await request(app)
      .get(`/api/places?from=${now.toISOString()}`)
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].id).toBe("two");
  });
});

describe("backup script", () => {
  it("creates backup and rotates", async () => {
    await writePlaces([
      {
        id: "one",
        lat: 50.45,
        lng: 30.52,
        createdAt: new Date().toISOString(),
        title: "Kyiv",
        note: "",
        source: "click",
      },
    ]);

    for (let i = 0; i < 9; i += 1) {
      await runBackup();
    }

    const files = (await fs.readdir(backupsDir)).filter((file) => file.endsWith(".json"));
    expect(files.length).toBeLessThanOrEqual(8);
  });
});
