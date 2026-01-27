import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { debounce } from "../utils/debounce.js";

export default function SearchBar({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  const fetchResults = useMemo(
    () =>
      debounce(async (value) => {
        if (!value.trim()) {
          setResults([]);
          setLoading(false);
          return;
        }
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        setLoading(true);
        try {
          const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
            value
          )}&limit=6&lang=en&countrycode=ua`;
          const response = await fetch(url, { signal: controller.signal });
          const data = await response.json();
          const formatted = (data.features || []).map((feature) => ({
            id: feature.properties.osm_id,
            label: `${feature.properties.name || feature.properties.city || ""} ${
              feature.properties.state || ""
            }`.trim(),
            coordinates: feature.geometry.coordinates
          }));
          setResults(formatted.filter((item) => item.label));
        } catch (error) {
          if (error.name !== "AbortError") {
            setResults([]);
          }
        } finally {
          setLoading(false);
        }
      }, 250),
    []
  );

  useEffect(() => {
    fetchResults(query);
  }, [query, fetchResults]);

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      onSelect(results[activeIndex]);
      setQuery("");
      setResults([]);
      setActiveIndex(-1);
    }
  };

  return (
    <div className="search-bar">
      <input
        type="search"
        placeholder="Search places in Ukraine"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Search places"
      />
      {loading && <span className="search-loading">Searching...</span>}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.ul
            className="search-results"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {results.map((result, index) => (
              <motion.li
                key={result.id}
                className={index === activeIndex ? "active" : ""}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  onSelect(result);
                  setQuery("");
                  setResults([]);
                  setActiveIndex(-1);
                }}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: index * 0.03 }}
              >
                {result.label}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
