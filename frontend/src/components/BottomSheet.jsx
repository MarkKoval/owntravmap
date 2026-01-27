import { AnimatePresence, motion } from "framer-motion";

export default function BottomSheet({ place, onConfirm, onCancel, reduceMotion }) {
  return (
    <AnimatePresence>
      {place && (
        <motion.div
          className="sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bottom-sheet"
            initial={{ y: 280 }}
            animate={{ y: 0 }}
            exit={{ y: 280 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 280 }}
            onDragEnd={(event, info) => {
              if (info.velocity.y > 900 || info.offset.y > 180) {
                onCancel();
              }
            }}
          >
            <div className="sheet-handle" />
            <h3>Confirm visit</h3>
            <div className="sheet-row">
              <label>
                Title
                <input
                  value={place.title}
                  onChange={(event) => place.setTitle(event.target.value)}
                />
              </label>
            </div>
            <div className="sheet-row">
              <label>
                Note
                <textarea
                  value={place.note}
                  onChange={(event) => place.setNote(event.target.value)}
                />
              </label>
            </div>
            <div className="sheet-coords">
              <span>Lat {place.lat.toFixed(4)}</span>
              <span>Lng {place.lng.toFixed(4)}</span>
            </div>
            <div className="sheet-actions">
              <button className="secondary" onClick={onCancel}>
                Cancel
              </button>
              <motion.button
                className="primary"
                onClick={onConfirm}
                whileTap={reduceMotion ? {} : { scale: 0.96 }}
              >
                Confirm visited
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
