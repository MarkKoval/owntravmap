import { describe, it, expect } from 'vitest';
import { groupPlacesByDay } from '../utils/date.js';

const places = [
  { id: '1', createdAt: '2024-06-10T12:00:00Z' },
  { id: '2', createdAt: '2024-06-10T15:00:00Z' },
  { id: '3', createdAt: '2024-06-11T09:00:00Z' }
];

describe('groupPlacesByDay', () => {
  it('groups by day key', () => {
    const grouped = groupPlacesByDay(places);
    expect(grouped['2024-06-10'].length).toBe(2);
    expect(grouped['2024-06-11'].length).toBe(1);
  });
});
