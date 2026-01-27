import { describe, it, expect, vi } from "vitest";
import { debounce } from "./debounce.js";

describe("debounce", () => {
  it("delays execution", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 200);
    debounced("test");
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledWith("test");
    vi.useRealTimers();
  });
});
