import { memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { AnimatePresence, motion } from 'framer-motion';
import { formatDateLabel } from '../utils/helpers.js';

const Row = memo(({ data, index, style }) => {
  const item = data.items[index];
  if (item.type === 'header') {
    return (
      <div style={style} className="timeline-header">
        {formatDateLabel(item.label)}
      </div>
    );
  }
  return (
    <motion.button
      style={style}
      className={`timeline-item ${data.selectedId === item.place.id ? 'active' : ''}`}
      onClick={() => data.onSelect(item.place)}
      whileHover={{ scale: data.reduceMotion ? 1 : 1.02 }}
      whileTap={{ scale: data.reduceMotion ? 1 : 0.98 }}
    >
      <div>
        <strong>{item.place.title || 'Visited place'}</strong>
        <span>{new Date(item.place.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      {item.place.note && <p>{item.place.note}</p>}
    </motion.button>
  );
});

const buildRows = (grouped) => {
  const rows = [];
  Object.entries(grouped)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .forEach(([day, places]) => {
      rows.push({ type: 'header', label: day });
      places
        .slice()
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .forEach((place) => rows.push({ type: 'item', place }));
    });
  return rows;
};

function Timeline({ grouped, onSelect, selectedId, reduceMotion }) {
  const rows = buildRows(grouped);
  const itemSize = 84;

  return (
    <div className="timeline-panel">
      <h2>Timeline</h2>
      <AnimatePresence>
        {rows.length ? (
          <List
            height={360}
            width="100%"
            itemCount={rows.length}
            itemSize={itemSize}
            itemData={{ items: rows, onSelect, selectedId, reduceMotion }}
          >
            {Row}
          </List>
        ) : (
          <motion.p
            className="timeline-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            No visits yet. Tap the map to add your first place.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Timeline;
