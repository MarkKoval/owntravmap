import { AnimatePresence, motion } from 'framer-motion';
import { motionTokens } from '../utils/motion.js';
import { useEffect, useState } from 'react';

const DEFAULT_COLOR = '#38bdf8';
const CATEGORY_OPTIONS = [
  { value: 'regular', label: 'Звичайна мітка' },
  { value: 'oblast-center', label: 'Обласний центр' }
];

export default function BottomSheet({ place, mode = 'create', onCancel, onConfirm, reduceMotion }) {
  const [form, setForm] = useState({
    title: '',
    note: '',
    visitDate: '',
    color: DEFAULT_COLOR,
    category: 'regular',
    photos: ''
  });

  useEffect(() => {
    if (place) {
      const createdFallback = place.createdAt ? place.createdAt.split('T')[0] : '';
      setForm({
        title: place.title || '',
        note: place.note || '',
        visitDate: place.visitDate || createdFallback || new Date().toISOString().split('T')[0],
        color: place.color || DEFAULT_COLOR,
        category: place.category || 'regular',
        photos: Array.isArray(place.photos) ? place.photos.join(', ') : ''
      });
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
        <h2>{mode === 'edit' ? 'Редагувати мітку' : 'Додати відвідування'}</h2>
        <p>
          {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
        </p>
        <label>
          Назва
          <input name="title" value={form.title} onChange={handleChange} />
        </label>
        <label>
          Дата відвідування
          <input type="date" name="visitDate" value={form.visitDate} onChange={handleChange} />
        </label>
        <label>
          Опис
          <textarea name="note" value={form.note} onChange={handleChange} />
        </label>
        <label>
          Колір мітки
          <input type="color" name="color" value={form.color} onChange={handleChange} />
        </label>
        <label>
          Категорія
          <select name="category" value={form.category} onChange={handleChange}>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Фото (URL через кому)
          <textarea name="photos" value={form.photos} onChange={handleChange} />
        </label>
        <div className="sheet-actions">
          <button className="ghost" type="button" onClick={onCancel}>
            Скасувати
          </button>
          <button
            className="primary"
            type="button"
            onClick={() =>
              onConfirm({
                ...place,
                title: form.title,
                note: form.note,
                visitDate: form.visitDate,
                color: form.color,
                category: form.category,
                photos: form.photos
                  .split(',')
                  .map((entry) => entry.trim())
                  .filter(Boolean),
                lat: place.lat,
                lng: place.lng,
                source: place.source
              })
            }
          >
            {mode === 'edit' ? 'Зберегти' : 'Підтвердити'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
