import { AnimatePresence, motion } from 'framer-motion';

const sheetVariants = {
  hidden: { y: 260, opacity: 0 },
  visible: { y: 0, opacity: 1 },
  exit: { y: 260, opacity: 0 }
};

export default function BottomSheet({ pendingPlace, onConfirm, onCancel, onUpdate, reduceMotion }) {
  return (
    <AnimatePresence>
      {pendingPlace && (
        <motion.div
          className="sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bottom-sheet"
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', stiffness: 180, damping: 22 }}
            drag={reduceMotion ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 200 }}
            dragElastic={0.2}
            onDragEnd={(event, info) => {
              if (info.offset.y > 120) {
                onCancel();
              }
            }}
            aria-modal="true"
            role="dialog"
          >
            <div className="sheet-handle" />
            <h3>Confirm visited</h3>
            <p className="sheet-coordinates">
              {pendingPlace.lat.toFixed(4)}, {pendingPlace.lng.toFixed(4)}
            </p>
            <label>
              Title
              <input
                value={pendingPlace.title}
                onChange={(event) => onUpdate({ title: event.target.value })}
                placeholder="Add a label"
              />
            </label>
            <label>
              Note
              <textarea
                value={pendingPlace.note}
                onChange={(event) => onUpdate({ note: event.target.value })}
                placeholder="Optional note"
              />
            </label>
            <div className="sheet-actions">
              <button className="button ghost" onClick={onCancel}>
                Cancel
              </button>
              <button className="button primary" onClick={onConfirm}>
                Confirm visited
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
