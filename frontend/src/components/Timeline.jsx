import { FixedSizeList as List } from "react-window";
import { groupPlacesByDay } from "../utils/date.js";

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}

function buildRows(places) {
  const grouped = groupPlacesByDay(places);
  const keys = Object.keys(grouped).sort((a, b) => (a > b ? -1 : 1));
  const rows = [];
  keys.forEach((key) => {
    rows.push({ type: "header", label: key });
    grouped[key]
      .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
      .forEach((place) => rows.push({ type: "item", place }));
  });
  return rows;
}

export default function Timeline({ places, onSelect }) {
  const rows = buildRows(places);
  const itemCount = rows.length;

  const Row = ({ index, style }) => {
    const row = rows[index];
    if (row.type === "header") {
      return (
        <div style={style} className="timeline-header">
          {formatDate(row.label)}
        </div>
      );
    }
    const { place } = row;
    return (
      <div
        style={style}
        className="timeline-item"
        role="button"
        tabIndex={0}
        onClick={() => onSelect(place)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onSelect(place);
        }}
      >
        <div className="timeline-title">{place.title || "Visited spot"}</div>
        <div className="timeline-meta">
          {new Date(place.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })}
        </div>
        {place.note && <div className="timeline-note">{place.note}</div>}
      </div>
    );
  };

  return (
    <div className="timeline-panel">
      <h3>Timeline</h3>
      <List height={360} itemCount={itemCount} itemSize={80} width="100%">
        {Row}
      </List>
    </div>
  );
}
