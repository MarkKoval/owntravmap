import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { promises as fs } from 'fs';
import path from 'path';
import { createApp } from '../src/app.js';

const dataPath = path.resolve('backend/data/places.json');
let originalData = '[]';

async function resetData() {
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  await fs.writeFile(dataPath, '[]');
}

describe('places api', () => {
  const app = createApp();

  beforeEach(async () => {
    try {
      originalData = await fs.readFile(dataPath, 'utf-8');
    } catch (error) {
      originalData = '[]';
    }
    await resetData();
  });

  afterEach(async () => {
    await fs.writeFile(dataPath, originalData);
  });

  it('creates a place within Ukraine', async () => {
    const response = await request(app)
      .post('/api/places')
      .send({ lat: 50.4501, lng: 30.5234, title: 'Kyiv' });

    expect(response.status).toBe(201);
    expect(response.body.id).toBeTruthy();
  });

  it('rejects a point outside Ukraine', async () => {
    const response = await request(app)
      .post('/api/places')
      .send({ lat: 52.52, lng: 13.405 });

    expect(response.status).toBe(400);
  });

  it('filters places by date range', async () => {
    const now = new Date();
    const yesterday = new Date(Date.now() - 86400000).toISOString();

    await request(app).post('/api/places').send({ lat: 50.4501, lng: 30.5234 });

    const response = await request(app).get(`/api/places?from=${yesterday}&to=${now.toISOString()}`);
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
  });
});
