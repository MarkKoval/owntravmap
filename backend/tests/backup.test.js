import { describe, it, expect, beforeEach } from "vitest";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { runBackup } from "../scripts/backup.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backupDir = path.join(__dirname, "..", "backups");
const dataFile = path.join(__dirname, "..", "data", "places.json");

async function createOldBackups(count) {
  await fs.mkdir(backupDir, { recursive: true });
  const base = new Date("2023-01-01T00:00:00Z");
  for (let i = 0; i < count; i += 1) {
    const date = new Date(base.getTime() + i * 24 * 60 * 60 * 1000);
    const name = `places-${date.toISOString().slice(0, 10)}.json`;
    await fs.writeFile(path.join(backupDir, name), "[]");
  }
}

describe("backup rotation", () => {
  beforeEach(async () => {
    await fs.writeFile(dataFile, JSON.stringify([{ id: "1" }], null, 2));
    await fs.rm(backupDir, { recursive: true, force: true });
  });

  it("creates backup and rotates old ones", async () => {
    await createOldBackups(10);
    await runBackup();
    const files = await fs.readdir(backupDir);
    const backups = files.filter((file) => file.startsWith("places-"));
    expect(backups.length).toBeLessThanOrEqual(8);
  });
});
