import { describe, it, expect } from "vitest";
import { filterPlacesByDate, groupPlacesByDay } from "./date.js";

const places = [
  { id: "1", createdAt: "2024-01-01T12:00:00Z" },
  { id: "2", createdAt: "2024-01-02T12:00:00Z" }
];

describe("filterPlacesByDate", () => {
  it("filters by from/to", () => {
    const filtered = filterPlacesByDate(places, "2024-01-02", "2024-01-03");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("2");
  });
});

describe("groupPlacesByDay", () => {
  it("groups by day", () => {
    const grouped = groupPlacesByDay(places);
    expect(Object.keys(grouped)).toHaveLength(2);
    expect(grouped["2024-01-01"]).toHaveLength(1);
  });
});
