import { useState } from 'react';

export default function DateFilter({ value, onChange }) {
  const [from, setFrom] = useState(value.from ? value.from.toISOString().slice(0, 10) : '');
  const [to, setTo] = useState(value.to ? value.to.toISOString().slice(0, 10) : '');

  const apply = (nextFrom, nextTo) => {
    onChange({
      from: nextFrom ? new Date(`${nextFrom}T00:00:00Z`) : null,
      to: nextTo ? new Date(`${nextTo}T23:59:59Z`) : null
    });
  };

  return (
    <div className="date-filter">
      <h3>Filter</h3>
      <div className="date-controls">
        <label>
          From
          <input
            type="date"
            value={from}
            onChange={(event) => {
              const next = event.target.value;
              setFrom(next);
              apply(next, to);
            }}
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={to}
            onChange={(event) => {
              const next = event.target.value;
              setTo(next);
              apply(from, next);
            }}
          />
        </label>
      </div>
      <button
        type="button"
        className="ghost"
        onClick={() => {
          setFrom('');
          setTo('');
          onChange({ from: null, to: null });
        }}
      >
        Clear range
      </button>
    </div>
  );
}
