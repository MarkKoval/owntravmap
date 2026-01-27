import { describe, expect, it, vi } from 'vitest';
import { debounce, groupByDay } from '../utils/helpers.js';

vi.useFakeTimers();

describe('helpers', () => {
  it('debounces calls', () => {
    const spy = vi.fn();
    const fn = debounce(spy, 200);
    fn('a');
    fn('b');
    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(spy).toHaveBeenCalledWith('b');
  });

  it('groups by day', () => {
    const places = [
      { id: '1', createdAt: '2024-01-01T10:00:00.000Z' },
      { id: '2', createdAt: '2024-01-01T12:00:00.000Z' },
      { id: '3', createdAt: '2024-01-02T09:00:00.000Z' }
    ];
    const grouped = groupByDay(places);
    expect(grouped['2024-01-01']).toHaveLength(2);
    expect(grouped['2024-01-02']).toHaveLength(1);
  });
});
