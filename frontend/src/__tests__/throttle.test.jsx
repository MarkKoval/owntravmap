import { describe, it, expect, vi } from 'vitest';
import { debounce, throttle } from '../utils/throttle.js';

vi.useFakeTimers();

describe('throttle', () => {
  it('throttles calls', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 200);
    throttled();
    throttled();
    vi.advanceTimersByTime(50);
    throttled();
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('debounce', () => {
  it('debounces calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 200);
    debounced();
    debounced();
    vi.advanceTimersByTime(199);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
