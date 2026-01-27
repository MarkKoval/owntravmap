import http from "node:http";
import cron from "node-cron";
import { createApp } from "./app.js";
import { runBackup } from "./backup.js";

const port = process.env.PORT || 4000;

const app = await createApp();
const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Backend listening on ${port}`);
});

cron.schedule("0 3 * * 0", async () => {
  try {
    await runBackup();
  } catch (error) {
    console.error("Backup failed", error);
  }
});
