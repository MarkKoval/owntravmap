import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { debounce } from "../utils/date.js";

const PHOTON_URL = "https://photon.komoot.io/api";
const UA_BBOX = [22.1372, 47.1, 40.2286, 52.4];

export default function SearchBar({ onSelect, reduceMotion }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const performSearch = useMemo(
    () =>
      debounce(async (value) => {
        if (!value) {
          setResults([]);
          return;
        }
        const params = new URLSearchParams({
          q: value,
          limit: "6",
          lang: "en",
          bbox: UA_BBOX.join(","),
        });
        const response = await fetch(`${PHOTON_URL}?${params.toString()}`);
        const data = await response.json();
        const filtered = data.features.filter(
          (feature) => feature.properties.countrycode === "UA"
        );
        setResults(filtered);
      }, 250),
    []
  );

  useEffect(() => {
    performSearch(query.trim());
  }, [performSearch, query]);

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, results.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    }
    if (event.key === "Enter" && results[highlightIndex]) {
      const feature = results[highlightIndex];
      onSelect(feature);
      setQuery(feature.properties.name);
      setResults([]);
      setHighlightIndex(-1);
    }
  };

  return (
    <div className="search-bar">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search Ukraine"
        aria-label="Search places in Ukraine"
      />
      <AnimatePresence>
        {results.length > 0 && (
          <motion.ul
            className="search-results"
            initial={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
            transition={{ duration: reduceMotion ? 0 : 0.25 }}
          >
            {results.map((feature, index) => (
              <motion.li
                key={feature.properties.osm_id}
                onClick={() => {
                  onSelect(feature);
                  setQuery(feature.properties.name);
                  setResults([]);
                  setHighlightIndex(-1);
                }}
                className={index === highlightIndex ? "active" : ""}
                layout
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
              >
                <span>{feature.properties.name}</span>
                <small>
                  {feature.properties.city || feature.properties.state || "Ukraine"}
                </small>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
