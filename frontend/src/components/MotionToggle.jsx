export default function MotionToggle({ reduceMotion, onChange }) {
  return (
    <div className="motion-toggle">
      <label>
        <input
          type="checkbox"
          checked={reduceMotion}
          onChange={(event) => onChange(event.target.checked)}
        />
        Reduce motion
      </label>
    </div>
  );
}
