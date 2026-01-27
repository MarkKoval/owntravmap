import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import MapView from './components/MapView.jsx';
import SearchBar from './components/SearchBar.jsx';
import BottomSheet from './components/BottomSheet.jsx';
import PhotoSphereModal from './components/PhotoSphereModal.jsx';
import Timeline from './components/Timeline.jsx';
import DateFilter from './components/DateFilter.jsx';
import MotionToggle from './components/MotionToggle.jsx';
import { fetchPlaces, createPlace, updatePlace } from './utils/api.js';
import { debounce } from './utils/throttle.js';
import { loadUkraineGeojson, isInUkraine } from './utils/geo.js';
import { motionTokens } from './utils/motion.js';

export default function App() {
  const [places, setPlaces] = useState([]);
  const [tempPlace, setTempPlace] = useState(null);
  const [editingPlace, setEditingPlace] = useState(null);
  const [galleryPlace, setGalleryPlace] = useState(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const heatRadius = 48;
  const heatIntensity = 1.1;
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [ukraineFeature, setUkraineFeature] = useState(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const mapControls = useRef({ map: null, flyTo: null });

  useEffect(() => {
    loadUkraineGeojson().then((geojson) => {
      setUkraineFeature(geojson.features[0]);
    });
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);
  }, []);

  const loadPlaces = useCallback(async (range) => {
    try {
      setLoading(true);
      const data = await fetchPlaces(range);
      setPlaces(data);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load places');
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedLoad = useMemo(() => debounce(loadPlaces, 300), [loadPlaces]);

  useEffect(() => {
    debouncedLoad(dateRange);
  }, [dateRange, debouncedLoad]);

  const handleMapClick = useCallback(
    (lngLat) => {
      if (!ukraineFeature) return;
      const within = isInUkraine(ukraineFeature, lngLat.lng, lngLat.lat);
      if (!within) {
        setErrorMessage('That point is outside Ukraine.');
        return;
      }
      setTempPlace({
        lng: lngLat.lng,
        lat: lngLat.lat,
        title: '',
        note: '',
        source: 'click',
        visitDate: new Date().toISOString().split('T')[0],
        color: '#38bdf8',
        category: 'regular',
        photos: []
      });
      setEditingPlace(null);
    },
    [ukraineFeature]
  );

  const handleConfirm = async (payload) => {
    try {
      if (editingPlace) {
        const updated = await updatePlace(editingPlace.id, payload);
        setPlaces((prev) => prev.map((place) => (place.id === updated.id ? updated : place)));
        setEditingPlace(null);
      } else {
        const created = await createPlace(payload);
        setPlaces((prev) => [created, ...prev]);
        setTempPlace(null);
      }
    } catch (error) {
      setErrorMessage(error.message || 'Failed to save place');
    }
  };

  const handleSearchSelect = (result) => {
    const next = {
      lng: result.lng,
      lat: result.lat,
      title: result.label,
      note: '',
      source: 'search',
      visitDate: new Date().toISOString().split('T')[0],
      color: '#38bdf8',
      category: 'regular',
      photos: []
    };
    setTempPlace(next);
    setEditingPlace(null);
    mapControls.current.flyTo?.({ center: [result.lng, result.lat], zoom: 9 });
  };

  const onMapReady = (map, flyTo) => {
    mapControls.current = { map, flyTo };
  };

  const handleTimelineSelect = (placeId) => {
    const target = places.find((place) => place.id === placeId);
    if (!target) return;
    setSelectedPlaceId(placeId);
    mapControls.current.flyTo?.({ center: [target.lng, target.lat], zoom: 9 });
  };

  const handleEditPlace = (place) => {
    setEditingPlace(place);
    setTempPlace(null);
  };

  const handleOblastCenterClick = (placeId) => {
    const target = places.find((place) => place.id === placeId);
    if (!target) return;
    setGalleryPlace(target);
  };

  return (
    <div className="app">
      <MapView
        places={places}
        tempPlace={tempPlace}
        onMapClick={handleMapClick}
        heatRadius={heatRadius}
        heatIntensity={heatIntensity}
        onMapReady={onMapReady}
        onSelectPlace={setSelectedPlaceId}
        onOblastCenterClick={handleOblastCenterClick}
        selectedPlaceId={selectedPlaceId}
        reduceMotion={reduceMotion}
      />
      <div className="top-bar">
        <SearchBar
          onSelect={handleSearchSelect}
          ukraineFeature={ukraineFeature}
          reduceMotion={reduceMotion}
        />
      </div>

      <motion.aside
        className="panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={motionTokens.spring}
      >
        <header>
          <h1>Visited Ukraine Map</h1>
          <p>Keep a living memory of every journey across Ukraine.</p>
        </header>
        <DateFilter value={dateRange} onChange={setDateRange} />
        <Timeline
          places={places}
          selectedPlaceId={selectedPlaceId}
          onSelect={handleTimelineSelect}
          onEdit={handleEditPlace}
        />
        <MotionToggle reduceMotion={reduceMotion} onChange={setReduceMotion} />
      </motion.aside>

      <BottomSheet
        place={editingPlace || tempPlace}
        mode={editingPlace ? 'edit' : 'create'}
        onCancel={() => {
          setTempPlace(null);
          setEditingPlace(null);
        }}
        onConfirm={handleConfirm}
        reduceMotion={reduceMotion}
      />

      <PhotoSphereModal place={galleryPlace} onClose={() => setGalleryPlace(null)} />

      <AnimatePresence>
        {errorMessage && (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={motionTokens.gentle}
          >
            {errorMessage}
            <button type="button" onClick={() => setErrorMessage('')}>Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="loading">Syncing visits…</div>
      )}
    </div>
  );
}
