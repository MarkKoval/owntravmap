import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import BottomSheet from "./components/BottomSheet.jsx";
import MapView from "./components/MapView.jsx";
import SearchBar from "./components/SearchBar.jsx";
import Timeline from "./components/Timeline.jsx";
import { usePlaces } from "./hooks/usePlaces.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function App() {
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [tempPlace, setTempPlace] = useState(null);
  const [focusPlace, setFocusPlace] = useState(null);
  const [heatConfig, setHeatConfig] = useState({ radius: 32, intensity: 1.2 });
  const [reduceMotion, setReduceMotion] = useState(false);
  const { filteredPlaces, refresh } = usePlaces(dateRange);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stored = localStorage.getItem("reduceMotion");
    setReduceMotion(stored ? stored === "true" : prefersReduced);
  }, []);

  const timelinePlaces = useMemo(() => filteredPlaces, [filteredPlaces]);

  const handleMapClick = (lngLat) => {
    setTempPlace({
      lat: lngLat.lat,
      lng: lngLat.lng,
      title: "",
      note: "",
      source: "click",
    });
  };

  const handleSearchSelect = (feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    setTempPlace({
      lat,
      lng,
      title: feature.properties.name,
      note: "",
      source: "search",
    });
    setFocusPlace({ lat, lng });
  };

  const handleConfirm = async () => {
    if (!tempPlace) return;
    await fetch(`${API_URL}/api/places`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tempPlace),
    });
    if (!reduceMotion) {
      setHeatConfig((prev) => ({ ...prev, intensity: prev.intensity + 0.6 }));
      setTimeout(
        () => setHeatConfig((prev) => ({ ...prev, intensity: 1.2 })),
        480
      );
    }
    setTempPlace(null);
    refresh();
  };

  const handleCancel = () => setTempPlace(null);

  const updateRange = (range) => {
    setDateRange(range);
  };

  const handleRangePreset = (days) => {
    if (!days) {
      updateRange({ from: "", to: "" });
      return;
    }
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);
    updateRange({ from: from.toISOString(), to: to.toISOString() });
  };

  const sheetPlace =
    tempPlace &&
    ({
      ...tempPlace,
      setTitle: (value) => setTempPlace((prev) => ({ ...prev, title: value })),
      setNote: (value) => setTempPlace((prev) => ({ ...prev, note: value })),
    });

  return (
    <div className="app">
      <motion.header
        className="app-header"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.6 }}
      >
        <div>
          <h1>Visited Ukraine Map</h1>
          <p>Track your journeys across Ukraine.</p>
        </div>
        <SearchBar onSelect={handleSearchSelect} reduceMotion={reduceMotion} />
      </motion.header>

      <div className="main">
        <MapView
          places={filteredPlaces}
          tempPlace={tempPlace}
          heatConfig={heatConfig}
          onMapClick={handleMapClick}
          focusPlace={focusPlace}
          reduceMotion={reduceMotion}
        />
        <aside className="side-panel">
          <div className="controls">
            <div className="segmented">
              <button onClick={() => handleRangePreset(7)}>7d</button>
              <button onClick={() => handleRangePreset(30)}>30d</button>
              <button onClick={() => handleRangePreset(null)}>All</button>
            </div>
            <div className="date-inputs">
              <label>
                From
                <input
                  type="date"
                  value={dateRange.from ? dateRange.from.slice(0, 10) : ""}
                  onChange={(event) =>
                    updateRange({
                      ...dateRange,
                      from: event.target.value
                        ? new Date(event.target.value).toISOString()
                        : "",
                    })
                  }
                />
              </label>
              <label>
                To
                <input
                  type="date"
                  value={dateRange.to ? dateRange.to.slice(0, 10) : ""}
                  onChange={(event) =>
                    updateRange({
                      ...dateRange,
                      to: event.target.value
                        ? new Date(event.target.value).toISOString()
                        : "",
                    })
                  }
                />
              </label>
            </div>
            <label className="slider">
              Heat radius
              <input
                type="range"
                min="18"
                max="60"
                value={heatConfig.radius}
                onChange={(event) =>
                  setHeatConfig((prev) => ({
                    ...prev,
                    radius: Number(event.target.value),
                  }))
                }
              />
            </label>
            <label className="toggle">
              Reduce motion
              <input
                type="checkbox"
                checked={reduceMotion}
                onChange={(event) => {
                  setReduceMotion(event.target.checked);
                  localStorage.setItem("reduceMotion", event.target.checked);
                }}
              />
            </label>
          </div>
          <Timeline
            places={timelinePlaces}
            onSelect={(place) => setFocusPlace(place)}
            selectedId={focusPlace?.id}
          />
        </aside>
      </div>

      <AnimatePresence>
        <BottomSheet
          place={sheetPlace}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          reduceMotion={reduceMotion}
        />
      </AnimatePresence>

      <footer className="attribution">
        Imagery © Esri · Labels © OpenStreetMap contributors, © CARTO · Geocoding
        by Photon
      </footer>
    </div>
  );
}
