import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import MapView from "./components/MapView.jsx";
import SearchBar from "./components/SearchBar.jsx";
import BottomSheet from "./components/BottomSheet.jsx";
import Timeline from "./components/Timeline.jsx";
import { filterPlacesByDate } from "./utils/date.js";
import { getUkrainePolygon, pointInPolygon } from "./utils/geo.js";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

function toGeojson(places) {
  return {
    type: "FeatureCollection",
    features: places.map((place) => ({
      type: "Feature",
      properties: {
        id: place.id
      },
      geometry: {
        type: "Point",
        coordinates: [place.lng, place.lat]
      }
    }))
  };
}

function haversineDistance([lng1, lat1], [lng2, lat2]) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function App() {
  const [places, setPlaces] = useState([]);
  const [ukraineGeojson, setUkraineGeojson] = useState(null);
  const [tempPlace, setTempPlace] = useState(null);
  const [placeDraft, setPlaceDraft] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [heatConfig, setHeatConfig] = useState({ radius: 40, intensity: 1.2 });
  const [reduceMotion, setReduceMotion] = useState(false);
  const mapRef = useRef(null);
  const flyQueueRef = useRef(Promise.resolve());

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    fetch(`${apiUrl}/api/places`)
      .then((res) => res.json())
      .then((data) => setPlaces(data))
      .catch(() => setPlaces([]));
  }, []);

  useEffect(() => {
    fetch("/assets/ukraine.geojson")
      .then((res) => res.json())
      .then((data) => setUkraineGeojson(data));
  }, []);

  const filteredPlaces = useMemo(
    () => filterPlacesByDate(places, dateRange.from, dateRange.to),
    [places, dateRange]
  );

  const placesGeojson = useMemo(() => toGeojson(places), [places]);
  const filteredGeojson = useMemo(() => toGeojson(filteredPlaces), [filteredPlaces]);

  const handleMapReady = (map) => {
    mapRef.current = map;
  };

  const runFlyTo = (center) => {
    if (!mapRef.current) return;
    const currentCenter = mapRef.current.getCenter();
    const distance = haversineDistance([currentCenter.lng, currentCenter.lat], center);
    const duration = Math.min(2200, Math.max(800, distance * 30));
    flyQueueRef.current = flyQueueRef.current.then(
      () =>
        new Promise((resolve) => {
          mapRef.current.flyTo({
            center,
            zoom: 9,
            duration,
            essential: !reduceMotion,
            curve: 1.3,
            easing: (t) => 1 - Math.pow(1 - t, 3)
          });
          setTimeout(resolve, duration);
        })
    );
  };

  const handleMapClick = ({ lng, lat }) => {
    if (!ukraineGeojson) return;
    const polygon = getUkrainePolygon(ukraineGeojson);
    if (!pointInPolygon([lng, lat], polygon)) return;
    setTempPlace({ lng, lat, source: "click" });
    setPlaceDraft({ lng, lat, title: "", note: "", source: "click" });
  };

  const handleSearchSelect = (result) => {
    const [lng, lat] = result.coordinates;
    setTempPlace({ lng, lat, source: "search" });
    setPlaceDraft({ lng, lat, title: result.label, note: "", source: "search" });
    runFlyTo([lng, lat]);
  };

  const handleConfirm = async () => {
    if (!placeDraft) return;
    const response = await fetch(`${apiUrl}/api/places`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: placeDraft.lat,
        lng: placeDraft.lng,
        title: placeDraft.title,
        note: placeDraft.note,
        source: placeDraft.source
      })
    });
    if (response.ok) {
      const newPlace = await response.json();
      setPlaces((prev) => [...prev, newPlace]);
      setPlaceDraft(null);
      setTempPlace(null);
      setHeatConfig((prev) => ({ ...prev, intensity: prev.intensity + 0.6 }));
      setTimeout(() => {
        setHeatConfig((prev) => ({ ...prev, intensity: Math.max(1, prev.intensity - 0.6) }));
      }, 500);
    }
  };

  const handleCancel = () => {
    setPlaceDraft(null);
    setTempPlace(null);
  };

  if (!ukraineGeojson) {
    return <div className="loading">Loading map…</div>;
  }

  const tempGeojson = tempPlace
    ? {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [tempPlace.lng, tempPlace.lat]
            }
          }
        ]
      }
    : null;

  return (
    <div className="app">
      <motion.header
        className="top-bar"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="brand">
          <span className="brand-title">Visited Ukraine Map</span>
          <span className="brand-subtitle">Satellite memories</span>
        </div>
        <SearchBar onSelect={handleSearchSelect} />
        <div className="toggles">
          <label className="toggle">
            <input
              type="checkbox"
              checked={reduceMotion}
              onChange={(event) => setReduceMotion(event.target.checked)}
            />
            Reduce motion
          </label>
        </div>
      </motion.header>

      <div className="main-layout">
        <motion.div
          className="map-shell"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <MapView
            ukraineGeojson={ukraineGeojson}
            placesGeojson={placesGeojson}
            filteredGeojson={filteredGeojson}
            tempPoint={tempGeojson}
            heatConfig={heatConfig}
            onMapClick={handleMapClick}
            onMapReady={handleMapReady}
            selectedPlace={selectedPlace}
          />
          <div className="heat-controls glass">
            <div>
              <label>Heat radius</label>
              <input
                type="range"
                min="20"
                max="80"
                value={heatConfig.radius}
                onChange={(event) =>
                  setHeatConfig((prev) => ({ ...prev, radius: Number(event.target.value) }))
                }
              />
            </div>
            <div>
              <label>Heat intensity</label>
              <input
                type="range"
                min="0.6"
                max="2.5"
                step="0.1"
                value={heatConfig.intensity}
                onChange={(event) =>
                  setHeatConfig((prev) => ({ ...prev, intensity: Number(event.target.value) }))
                }
              />
            </div>
          </div>
        </motion.div>

        <aside className="side-panel glass">
          <div className="filters">
            <label>
              From
              <input
                type="date"
                value={dateRange.from}
                onChange={(event) => setDateRange((prev) => ({ ...prev, from: event.target.value }))}
              />
            </label>
            <label>
              To
              <input
                type="date"
                value={dateRange.to}
                onChange={(event) => setDateRange((prev) => ({ ...prev, to: event.target.value }))}
              />
            </label>
          </div>
          <Timeline
            places={filteredPlaces}
            onSelect={(place) => {
              setSelectedPlace(place);
              runFlyTo([place.lng, place.lat]);
            }}
          />
        </aside>
      </div>

      <BottomSheet
        isOpen={Boolean(placeDraft)}
        placeDraft={placeDraft || { lat: 0, lng: 0, title: "", note: "" }}
        onChange={(updates) => setPlaceDraft((prev) => ({ ...prev, ...updates }))}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        reduceMotion={reduceMotion}
      />

      <footer className="attribution">
        <span>
          Satellite imagery © Esri. Labels © OpenStreetMap contributors. Geocoding by Photon.
        </span>
      </footer>
    </div>
  );
}
