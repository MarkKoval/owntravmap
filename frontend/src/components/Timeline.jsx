import { motion } from "framer-motion";
import { useMemo } from "react";
import { FixedSizeList as List } from "react-window";
import { groupPlacesByDay } from "../utils/date.js";

function buildRows(places) {
  const grouped = groupPlacesByDay(places);
  const sortedDays = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));
  const rows = [];
  sortedDays.forEach((day) => {
    rows.push({ type: "header", id: `header-${day}`, day });
    grouped[day]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .forEach((place) => rows.push({ type: "item", id: place.id, place }));
  });
  return rows;
}

export default function Timeline({ places, onSelect, selectedId }) {
  const rows = useMemo(() => buildRows(places), [places]);

  return (
    <div className="timeline">
      <h2>Timeline</h2>
      <List height={360} itemCount={rows.length} itemSize={54} width="100%">
        {({ index, style }) => {
          const row = rows[index];
          if (row.type === "header") {
            return (
              <div style={style} className="timeline-header">
                {row.day}
              </div>
            );
          }
          return (
            <motion.button
              style={style}
              className={`timeline-item ${selectedId === row.place.id ? "active" : ""}`}
              onClick={() => onSelect(row.place)}
              layout
            >
              <span>{row.place.title || "Visited place"}</span>
              <small>{new Date(row.place.createdAt).toLocaleTimeString()}</small>
            </motion.button>
          );
        }}
      </List>
    </div>
  );
}
