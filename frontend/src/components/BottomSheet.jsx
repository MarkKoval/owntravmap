import { motion, AnimatePresence } from "framer-motion";

export default function BottomSheet({
  isOpen,
  placeDraft,
  onChange,
  onConfirm,
  onCancel,
  reduceMotion
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bottom-sheet"
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            transition={
              reduceMotion
                ? { duration: 0.2 }
                : { type: "spring", stiffness: 200, damping: 24 }
            }
            drag="y"
            dragConstraints={{ top: 0, bottom: 180 }}
            onDragEnd={(event, info) => {
              if (info.offset.y > 140) onCancel();
            }}
          >
            <div className="sheet-handle" />
            <div className="sheet-content">
              <p className="sheet-label">New visit</p>
              <div className="coords">
                <span>Lat {placeDraft.lat.toFixed(4)}</span>
                <span>Lng {placeDraft.lng.toFixed(4)}</span>
              </div>
              <label>
                Title
                <input
                  type="text"
                  value={placeDraft.title}
                  onChange={(event) => onChange({ title: event.target.value })}
                />
              </label>
              <label>
                Note
                <textarea
                  rows="3"
                  value={placeDraft.note}
                  onChange={(event) => onChange({ note: event.target.value })}
                />
              </label>
              <div className="sheet-actions">
                <button className="btn ghost" onClick={onCancel}>
                  Cancel
                </button>
                <button className="btn primary" onClick={onConfirm}>
                  Confirm visited
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
