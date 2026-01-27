import cron from 'node-cron';
import { createApp } from './app.js';
import { runBackup } from './backup.js';

const PORT = process.env.PORT || 4000;
const app = createApp();

cron.schedule('0 3 * * 0', async () => {
  try {
    await runBackup();
  } catch (error) {
    console.error('Scheduled backup failed', error);
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on ${PORT}`);
});
