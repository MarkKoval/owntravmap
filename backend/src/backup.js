import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDataPath, ensureDataFile } from './storage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backupDir = path.resolve(__dirname, '..', 'backups');

const ensureBackupDir = () => {
  fs.mkdirSync(backupDir, { recursive: true });
};

const formatDate = (date) => date.toISOString().split('T')[0];

export const runBackup = () => {
  ensureDataFile();
  ensureBackupDir();
  const dateTag = formatDate(new Date());
  const src = getDataPath();
  const dest = path.join(backupDir, `places-${dateTag}.json`);
  fs.copyFileSync(src, dest);

  const backups = fs
    .readdirSync(backupDir)
    .filter((file) => file.startsWith('places-') && file.endsWith('.json'))
    .sort();

  if (backups.length > 8) {
    const toRemove = backups.slice(0, backups.length - 8);
    toRemove.forEach((file) => fs.unlinkSync(path.join(backupDir, file)));
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runBackup();
}
