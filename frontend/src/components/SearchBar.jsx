import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { debounce } from '../utils/throttle.js';
import { isInUkraine } from '../utils/geo.js';
import { motionTokens } from '../utils/motion.js';
import { searchPlaces } from '../utils/api.js';

export default function SearchBar({ onSelect, ukraineFeature, reduceMotion }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const search = async (value) => {
    if (!value || value.length < 3) {
      setResults([]);
      return;
    }
    const trimmed = value.trim();
    if (trimmed.length < 3) {
      setResults([]);
      return;
    }
    try {
      const data = await searchPlaces(trimmed);
      const mapped = data.features
        .map((feature) => ({
          id: feature.properties.osm_id || feature.properties.place_id,
          label: feature.properties.name || feature.properties.city || feature.properties.country,
          lng: feature.geometry.coordinates[0],
          lat: feature.geometry.coordinates[1],
          country: feature.properties.country,
          countryCode: feature.properties.countrycode
        }))
        .filter((item) => item.label)
        .filter((item) => {
          if (item.countryCode?.toUpperCase() === 'UA') return true;
          if (item.country?.toLowerCase?.() === 'ukraine') return true;
          if (item.country?.toLowerCase?.() === 'україна') return true;
          if (!ukraineFeature) return true;
          return isInUkraine(ukraineFeature, item.lng, item.lat);
        });
      setResults(mapped);
      setActiveIndex(0);
    } catch (error) {
      setResults([]);
    }
  };

  const debouncedSearch = useMemo(() => debounce(search, 240), [ukraineFeature]);

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  const handleSelect = (item) => {
    onSelect?.(item);
    setQuery(item.label);
    setResults([]);
  };

  const handleKeyDown = (event) => {
    if (!results.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((value) => (value + 1) % results.length);
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((value) => (value - 1 + results.length) % results.length);
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSelect(results[activeIndex]);
    }
  };

  return (
    <div className="search">
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Пошук місць в Україні"
        aria-label="Search"
      />
      <AnimatePresence>
        {results.length > 0 && (
          <motion.ul
            className="search-results"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={reduceMotion ? { duration: 0 } : motionTokens.gentle}
          >
            {results.map((item, index) => (
              <motion.li
                key={item.id}
                className={index === activeIndex ? 'active' : ''}
                onClick={() => handleSelect(item)}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                {item.label}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
