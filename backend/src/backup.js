import fs from "node:fs/promises";
import path from "node:path";
import { getDataPath, ensureDataFile } from "./storage.js";

const backupsDir = path.resolve("backend/backups");

export async function runBackup() {
  await ensureDataFile();
  await fs.mkdir(backupsDir, { recursive: true });
  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10);
  const destination = path.join(backupsDir, `places-${dateStamp}.json`);
  await fs.copyFile(getDataPath(), destination);

  const files = (await fs.readdir(backupsDir))
    .filter((file) => file.startsWith("places-") && file.endsWith(".json"))
    .sort();

  if (files.length > 8) {
    const toRemove = files.slice(0, files.length - 8);
    await Promise.all(toRemove.map((file) => fs.unlink(path.join(backupsDir, file))));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runBackup();
}
