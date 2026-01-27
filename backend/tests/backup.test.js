import { beforeEach, describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { runBackup } from '../src/backup.js';
import { ensureDataFile } from '../src/storage.js';

const backupDir = path.resolve('backend/backups');

beforeEach(() => {
  fs.rmSync(backupDir, { recursive: true, force: true });
  process.env.DATA_FILE = path.resolve('backend/tests/fixtures/places.backup.json');
  fs.mkdirSync(path.dirname(process.env.DATA_FILE), { recursive: true });
  fs.writeFileSync(process.env.DATA_FILE, JSON.stringify([{ id: '1' }]));
  ensureDataFile();
});

describe('backup rotation', () => {
  it('creates backups and rotates older ones', () => {
    for (let i = 0; i < 9; i += 1) {
      const date = new Date(2024, 0, i + 1);
      const originalDate = Date;
      global.Date = class extends Date {
        constructor() {
          super();
          return date;
        }
      };
      runBackup();
      global.Date = originalDate;
    }

    const backups = fs
      .readdirSync(backupDir)
      .filter((file) => file.startsWith('places-'));
    expect(backups.length).toBe(8);
  });
});
