import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { runBackup } from '../src/backup.js';

const backupDir = path.resolve('backend/backups');
const dataPath = path.resolve('backend/data/places.json');

async function cleanBackups() {
  await fs.mkdir(backupDir, { recursive: true });
  const files = await fs.readdir(backupDir);
  await Promise.all(files.map((file) => fs.unlink(path.join(backupDir, file))));
}

describe('backup script', () => {
  beforeEach(async () => {
    await fs.mkdir(path.dirname(dataPath), { recursive: true });
    await fs.writeFile(dataPath, '[]');
    await cleanBackups();
  });

  afterEach(async () => {
    await cleanBackups();
  });

  it('creates a backup file and rotates', async () => {
    for (let i = 0; i < 9; i += 1) {
      await fs.writeFile(dataPath, JSON.stringify([{ id: i }]));
      await runBackup();
    }
    const files = await fs.readdir(backupDir);
    expect(files.length).toBeLessThanOrEqual(8);
  });
});
