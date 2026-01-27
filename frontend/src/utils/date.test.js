import { describe, expect, it, vi } from "vitest";
import { debounce, filterPlacesByRange, groupPlacesByDay } from "./date.js";

describe("date utilities", () => {
  it("filters by date range", () => {
    const places = [
      { id: "a", createdAt: "2024-01-01T10:00:00.000Z" },
      { id: "b", createdAt: "2024-02-01T10:00:00.000Z" },
    ];
    const filtered = filterPlacesByRange(places, {
      from: "2024-01-15T00:00:00.000Z",
      to: "2024-02-01T23:59:59.000Z",
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("b");
  });

  it("groups by day", () => {
    const grouped = groupPlacesByDay([
      { id: "a", createdAt: "2024-01-01T10:00:00.000Z" },
      { id: "b", createdAt: "2024-01-01T15:00:00.000Z" },
      { id: "c", createdAt: "2024-01-02T09:00:00.000Z" },
    ]);
    expect(Object.keys(grouped)).toHaveLength(2);
    expect(grouped["2024-01-01"]).toHaveLength(2);
  });

  it("debounces calls", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 200);
    debounced("a");
    debounced("b");
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
