import { beforeEach, describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import request from 'supertest';

const dataFile = path.resolve('backend/tests/fixtures/places.test.json');

const loadApp = async () => {
  process.env.DATA_FILE = dataFile;
  const { default: app } = await import('../src/index.js');
  return app;
};

const readData = () => JSON.parse(fs.readFileSync(dataFile, 'utf-8'));

beforeEach(() => {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify([]));
});

describe('places api', () => {
  it('accepts a valid point inside Ukraine', async () => {
    const app = await loadApp();
    const response = await request(app)
      .post('/api/places')
      .send({ lat: 50.45, lng: 30.52, source: 'click' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ lat: 50.45, lng: 30.52, source: 'click' });
    expect(readData()).toHaveLength(1);
  });

  it('rejects a point outside Ukraine', async () => {
    const app = await loadApp();
    const response = await request(app)
      .post('/api/places')
      .send({ lat: 48.85, lng: 2.35, source: 'search' });

    expect(response.status).toBe(400);
  });

  it('filters by date range', async () => {
    const app = await loadApp();
    await request(app)
      .post('/api/places')
      .send({ lat: 50.45, lng: 30.52, source: 'click' });

    const all = await request(app).get('/api/places');
    const createdAt = all.body[0].createdAt;
    const from = new Date(createdAt);
    const to = new Date(createdAt);
    from.setMinutes(from.getMinutes() + 1);

    const filtered = await request(app).get(`/api/places?from=${from.toISOString()}&to=${to.toISOString()}`);
    expect(filtered.body).toHaveLength(0);
  });
});
