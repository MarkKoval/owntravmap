import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataFile = path.join(__dirname, "..", "data", "places.json");
const backupDir = path.join(__dirname, "..", "backups");

export async function runBackup() {
  await fs.mkdir(backupDir, { recursive: true });
  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10);
  const backupFile = path.join(backupDir, `places-${dateStamp}.json`);
  await fs.copyFile(dataFile, backupFile);

  const files = await fs.readdir(backupDir);
  const backups = files
    .filter((file) => file.startsWith("places-") && file.endsWith(".json"))
    .sort();

  if (backups.length > 8) {
    const toDelete = backups.slice(0, backups.length - 8);
    await Promise.all(toDelete.map((file) => fs.unlink(path.join(backupDir, file))));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runBackup().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
