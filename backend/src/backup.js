import { promises as fs } from 'fs';
import path from 'path';
import { getDataPath } from './storage.js';

const BACKUP_DIR = path.resolve('backend/backups');
const ROTATION_LIMIT = 8;

export async function runBackup() {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  const sourcePath = getDataPath();
  const dateStamp = new Date().toISOString().slice(0, 10);
  const targetPath = path.join(BACKUP_DIR, `places-${dateStamp}.json`);
  await fs.copyFile(sourcePath, targetPath);

  const backups = (await fs.readdir(BACKUP_DIR))
    .filter((file) => file.startsWith('places-') && file.endsWith('.json'))
    .sort();

  if (backups.length > ROTATION_LIMIT) {
    const remove = backups.slice(0, backups.length - ROTATION_LIMIT);
    await Promise.all(remove.map((file) => fs.unlink(path.join(BACKUP_DIR, file))));
  }

  return targetPath;
}

if (process.argv[1] && process.argv[1].includes('backup.js')) {
  runBackup()
    .then((target) => {
      console.log(`Backup created: ${target}`);
    })
    .catch((error) => {
      console.error('Backup failed', error);
      process.exit(1);
    });
}
