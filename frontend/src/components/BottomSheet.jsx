import { AnimatePresence, motion } from 'framer-motion';
import { motionTokens } from '../utils/motion.js';
import { useEffect, useState } from 'react';

export default function BottomSheet({ place, onCancel, onConfirm, reduceMotion }) {
  const [form, setForm] = useState({ title: '', note: '' });

  useEffect(() => {
    if (place) {
      setForm({ title: place.title || '', note: place.note || '' });
    }
  }, [place]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  if (!place) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="sheet"
        data-testid="confirm-sheet"
        initial={{ y: 260, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 260, opacity: 0 }}
        transition={reduceMotion ? { duration: 0 } : motionTokens.spring}
        drag="y"
        dragConstraints={{ top: 0, bottom: 200 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.velocity.y > 500 || info.offset.y > 160) {
            onCancel();
          }
        }}
        role="dialog"
        aria-modal="true"
      >
        <div className="sheet-handle" />
        <h2>Confirm visit</h2>
        <p>
          {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
        </p>
        <label>
          Title
          <input name="title" value={form.title} onChange={handleChange} />
        </label>
        <label>
          Note
          <textarea name="note" value={form.note} onChange={handleChange} />
        </label>
        <div className="sheet-actions">
          <button className="ghost" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="primary"
            type="button"
            onClick={() =>
              onConfirm({
                ...place,
                title: form.title,
                note: form.note,
                lat: place.lat,
                lng: place.lng,
                source: place.source
              })
            }
          >
            Confirm visited
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
