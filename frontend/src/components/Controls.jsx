import { motion } from 'framer-motion';

export default function Controls({ range, onRangeChange, heat, onHeatChange, reduceMotion, onReduceMotion }) {
  return (
    <motion.div
      className="controls"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.4 }}
    >
      <div className="control-group">
        <span>Date range</span>
        <div className="date-controls">
          <input
            type="date"
            value={range.from}
            onChange={(event) => onRangeChange({ from: event.target.value })}
          />
          <input
            type="date"
            value={range.to}
            onChange={(event) => onRangeChange({ to: event.target.value })}
          />
        </div>
      </div>
      <div className="control-group">
        <span>Heat radius</span>
        <input
          type="range"
          min="10"
          max="60"
          value={heat.radius}
          onChange={(event) => onHeatChange({ radius: Number(event.target.value) })}
        />
      </div>
      <div className="control-group">
        <span>Heat intensity</span>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={heat.intensity}
          onChange={(event) => onHeatChange({ intensity: Number(event.target.value) })}
        />
      </div>
      <label className="toggle">
        <input type="checkbox" checked={reduceMotion} onChange={(event) => onReduceMotion(event.target.checked)} />
        Reduce motion
      </label>
    </motion.div>
  );
}
