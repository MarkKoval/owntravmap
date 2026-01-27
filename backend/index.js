import cron from "node-cron";
import { createApp } from "./app.js";
import { runBackup } from "./scripts/backup.js";

const PORT = process.env.PORT || 4000;

const app = await createApp();

app.listen(PORT, () => {
  console.log(`Backend listening on ${PORT}`);
});

cron.schedule("0 3 * * 1", async () => {
  try {
    await runBackup();
    console.log("Weekly backup completed");
  } catch (error) {
    console.error("Backup failed", error);
  }
});
