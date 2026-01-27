import { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { groupPlacesByDay, formatDayLabel } from '../utils/date.js';

export default function Timeline({ places, onSelect, selectedPlaceId }) {
  const rows = useMemo(() => {
    const grouped = groupPlacesByDay(places);
    const sortedDays = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
    const items = [];
    sortedDays.forEach((day) => {
      items.push({ type: 'header', id: day, label: formatDayLabel(day) });
      grouped[day].forEach((place) => {
        items.push({ type: 'place', id: place.id, place });
      });
    });
    return items;
  }, [places]);

  return (
    <div className="timeline">
      <h3>Timeline</h3>
      <List height={360} itemCount={rows.length} itemSize={56} width="100%">
        {({ index, style }) => {
          const item = rows[index];
          if (item.type === 'header') {
            return (
              <div className="timeline-day" style={style}>
                {item.label}
              </div>
            );
          }
          const place = item.place;
          return (
            <button
              type="button"
              className={`timeline-item ${place.id === selectedPlaceId ? 'active' : ''}`}
              style={style}
              onClick={() => onSelect?.(place.id)}
            >
              <div>
                <strong>{place.title || 'Untitled place'}</strong>
                <span>{new Date(place.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {place.note && <p>{place.note}</p>}
            </button>
          );
        }}
      </List>
    </div>
  );
}
