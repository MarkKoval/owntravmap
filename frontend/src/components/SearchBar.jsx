import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { debounce } from '../utils/helpers.js';

const baseStyles = {
  container: 'search-container',
  input: 'search-input',
  list: 'search-list',
  item: 'search-item',
  empty: 'search-empty'
};

export default function SearchBar({ onSelect, geocoderUrl, withinUkraine, reduceMotion }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const abortRef = useRef(null);

  const fetchResults = async (value) => {
    if (!value) {
      setResults([]);
      return;
    }
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;
    const url = `${geocoderUrl}?q=${encodeURIComponent(value)}&limit=6&lang=en&bbox=22.1,44.3,40.2,52.4`;
    const response = await fetch(url, { signal: controller.signal });
    const data = await response.json();
    const filtered = (data.features || []).filter((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      return withinUkraine([lng, lat]);
    });
    setResults(filtered);
  };

  const debouncedFetch = useMemo(() => debounce(fetchResults, 250), []);

  useEffect(() => {
    debouncedFetch(query.trim());
  }, [query, debouncedFetch]);

  const handleSelect = (feature) => {
    setQuery(feature.properties.name);
    setResults([]);
    onSelect(feature);
  };

  const handleKeyDown = (event) => {
    if (!results.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
    }
    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      handleSelect(results[activeIndex]);
    }
  };

  return (
    <div className={baseStyles.container}>
      <input
        className={baseStyles.input}
        placeholder="Search places in Ukraine"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Search places"
      />
      <AnimatePresence>
        {query.length > 1 && (
          <motion.div
            className={baseStyles.list}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            role="listbox"
          >
            {results.length ? (
              results.map((feature, index) => (
                <motion.button
                  key={feature.properties.osm_id}
                  className={baseStyles.item}
                  onClick={() => handleSelect(feature)}
                  role="option"
                  aria-selected={index === activeIndex}
                  whileHover={{ scale: reduceMotion ? 1 : 1.02 }}
                  whileTap={{ scale: reduceMotion ? 1 : 0.98 }}
                >
                  <span>{feature.properties.name}</span>
                  <small>{feature.properties.city || feature.properties.state || 'Ukraine'}</small>
                </motion.button>
              ))
            ) : (
              <div className={baseStyles.empty}>No results in Ukraine</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
