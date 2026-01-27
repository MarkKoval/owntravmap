import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map, { Layer, Source } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import { AnimatePresence, motion } from 'framer-motion';
import SearchBar from './components/SearchBar.jsx';
import BottomSheet from './components/BottomSheet.jsx';
import Timeline from './components/Timeline.jsx';
import Controls from './components/Controls.jsx';
import ukraineGeojson from './assets/ukraine.geojson';
import { buildMapStyle, buildMaskFeature, ukraineBounds } from './utils/mapStyle.js';
import { debounce, groupByDay } from './utils/helpers.js';
import { pointInPolygon } from './utils/geo.js';

const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5179';

const motionTokens = {
  spring: { type: 'spring', stiffness: 120, damping: 20 },
  cinematic: [0.2, 0.8, 0.2, 1]
};

const mapStyle = buildMapStyle();

const createFeatureCollection = (places) => ({
  type: 'FeatureCollection',
  features: places.map((place) => ({
    type: 'Feature',
    properties: {
      id: place.id,
      title: place.title,
      weight: 1
    },
    geometry: {
      type: 'Point',
      coordinates: [place.lng, place.lat]
    }
  }))
});

const flattenMask = buildMaskFeature(ukraineGeojson.features[0].geometry.coordinates);

const isWithinUkraine = (point) =>
  pointInPolygon(point, ukraineGeojson.features[0].geometry.coordinates[0]);

export default function App() {
  const mapRef = useRef(null);
  const [places, setPlaces] = useState([]);
  const [pendingPlace, setPendingPlace] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [range, setRange] = useState({ from: '', to: '' });
  const [heat, setHeat] = useState({ radius: 30, intensity: 1 });
  const [reduceMotion, setReduceMotion] = useState(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [isLoading, setIsLoading] = useState(true);
  const [highlightPoint, setHighlightPoint] = useState(null);

  const fetchPlaces = useCallback(async () => {
    const params = new URLSearchParams();
    if (range.from) params.set('from', new Date(range.from).toISOString());
    if (range.to) params.set('to', new Date(range.to).toISOString());
    const response = await fetch(`${apiBase}/api/places?${params.toString()}`);
    const data = await response.json();
    setPlaces(data);
    setIsLoading(false);
  }, [range]);

  const debouncedFetch = useMemo(() => debounce(fetchPlaces, 300), [fetchPlaces]);

  useEffect(() => {
    debouncedFetch();
  }, [debouncedFetch]);

  const geojson = useMemo(() => createFeatureCollection(places), [places]);
  const grouped = useMemo(() => groupByDay(places), [places]);

  const handleMapClick = (event) => {
    const { lngLat } = event;
    const point = [lngLat.lng, lngLat.lat];
    if (!isWithinUkraine(point)) {
      return;
    }
    setPendingPlace({
      lat: lngLat.lat,
      lng: lngLat.lng,
      title: '',
      note: '',
      source: 'click'
    });
  };

  const handleConfirm = async () => {
    if (!pendingPlace) return;
    const response = await fetch(`${apiBase}/api/places`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pendingPlace)
    });
    if (response.ok) {
      const saved = await response.json();
      setPlaces((prev) => [...prev, saved]);
      setPendingPlace(null);
      setHighlightPoint(saved);
      setTimeout(() => setHighlightPoint(null), 1200);
    }
  };

  const handleCancel = () => {
    setPendingPlace(null);
  };

  const handleSearchSelect = (feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    if (!isWithinUkraine([lng, lat])) return;
    const map = mapRef.current?.getMap();
    if (map) {
      flyTo(map, { lng, lat });
    }
    setPendingPlace({
      lat,
      lng,
      title: feature.properties.name || '',
      note: '',
      source: 'search'
    });
  };

  const flyTo = (map, { lng, lat }) => {
    const current = map.getCenter();
    const distance = Math.hypot(current.lng - lng, current.lat - lat);
    const duration = Math.min(2200, Math.max(800, distance * 400));
    map.flyTo({
      center: [lng, lat],
      zoom: Math.max(map.getZoom(), 6.5),
      speed: 0.8,
      curve: 1.3,
      duration,
      easing: (t) => 1 - Math.pow(1 - t, 3)
    });
  };

  const handleSelectPlace = (place) => {
    setSelectedPlace(place);
    const map = mapRef.current?.getMap();
    if (map) {
      flyTo(map, { lng: place.lng, lat: place.lat });
      setHighlightPoint(place);
      setTimeout(() => setHighlightPoint(null), 1400);
    }
  };

  const handleRangeChange = (next) => {
    setRange((prev) => ({ ...prev, ...next }));
  };

  const handleHeatChange = (next) => {
    setHeat((prev) => ({ ...prev, ...next }));
  };

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Visited Ukraine Map</h1>
          <p>Track your journeys across Ukraine.</p>
        </div>
        <SearchBar
          onSelect={handleSearchSelect}
          geocoderUrl={import.meta.env.VITE_GEOCODER_URL || 'https://photon.komoot.io/api/'}
          withinUkraine={isWithinUkraine}
          reduceMotion={reduceMotion}
        />
      </header>

      <div className="app-body">
        <motion.div
          className="map-wrapper"
          data-testid="map-wrapper"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6 }}
        >
          <Map
            ref={mapRef}
            mapLib={maplibregl}
            mapStyle={mapStyle}
            initialViewState={{ longitude: 31.2, latitude: 49.0, zoom: 5.5 }}
            maxBounds={ukraineBounds}
            minZoom={4.8}
            maxZoom={14}
            onClick={handleMapClick}
            attributionControl={false}
            dragRotate={false}
            touchPitch={false}
            worldCopyJump={false}
          >
            <Source id="mask" type="geojson" data={flattenMask}>
              <Layer
                id="outside-mask"
                type="fill"
                paint={{
                  'fill-color': 'rgba(8, 12, 22, 0.72)',
                  'fill-opacity': 0.72
                }}
              />
            </Source>

            <Source
              id="places"
              type="geojson"
              data={geojson}
              cluster
              clusterRadius={60}
              clusterMaxZoom={9}
            >
              <Layer
                id="heat"
                type="heatmap"
                paint={{
                  'heatmap-radius': heat.radius,
                  'heatmap-intensity': heat.intensity,
                  'heatmap-opacity': 0.8,
                  'heatmap-weight': ['get', 'weight'],
                  'heatmap-color': [
                    'interpolate',
                    ['linear'],
                    ['heatmap-density'],
                    0,
                    'rgba(56, 120, 255, 0)',
                    0.3,
                    'rgba(68, 194, 255, 0.6)',
                    0.6,
                    'rgba(134, 99, 255, 0.8)',
                    1,
                    'rgba(255, 92, 143, 0.9)'
                  ]
                }}
              />
              <Layer
                id="clusters"
                type="circle"
                filter={['has', 'point_count']}
                paint={{
                  'circle-color': 'rgba(120, 162, 255, 0.75)',
                  'circle-radius': ['step', ['get', 'point_count'], 18, 10, 24, 30, 32],
                  'circle-opacity': 0.85,
                  'circle-stroke-color': 'rgba(245, 248, 255, 0.8)',
                  'circle-stroke-width': 2,
                  'circle-radius-transition': { duration: reduceMotion ? 0 : 250 },
                  'circle-opacity-transition': { duration: reduceMotion ? 0 : 250 }
                }}
              />
              <Layer
                id="cluster-count"
                type="symbol"
                filter={['has', 'point_count']}
                layout={{
                  'text-field': '{point_count_abbreviated}',
                  'text-size': 12
                }}
                paint={{
                  'text-color': '#0c1220'
                }}
              />
              <Layer
                id="unclustered"
                type="circle"
                filter={['!', ['has', 'point_count']]}
                paint={{
                  'circle-color': '#f2f6ff',
                  'circle-radius': 4,
                  'circle-stroke-width': 1,
                  'circle-stroke-color': '#6e83ff'
                }}
              />
            </Source>

            {pendingPlace && (
              <Source
                id="pending"
                type="geojson"
                data={{
                  type: 'FeatureCollection',
                  features: [
                    {
                      type: 'Feature',
                      geometry: {
                        type: 'Point',
                        coordinates: [pendingPlace.lng, pendingPlace.lat]
                      },
                      properties: {}
                    }
                  ]
                }}
              >
                <Layer
                  id="pending-point"
                  type="circle"
                  paint={{
                    'circle-color': '#fef3c7',
                    'circle-radius': 8,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#f97316'
                  }}
                />
              </Source>
            )}

            {highlightPoint && (
              <Source
                id="highlight"
                type="geojson"
                data={{
                  type: 'FeatureCollection',
                  features: [
                    {
                      type: 'Feature',
                      geometry: {
                        type: 'Point',
                        coordinates: [highlightPoint.lng, highlightPoint.lat]
                      },
                      properties: {}
                    }
                  ]
                }}
              >
                <Layer
                  id="pulse"
                  type="circle"
                  paint={{
                    'circle-color': 'rgba(120, 162, 255, 0.2)',
                    'circle-radius': 18,
                    'circle-stroke-color': 'rgba(255,255,255,0.8)',
                    'circle-stroke-width': 1
                  }}
                />
              </Source>
            )}
          </Map>

          <div className="map-attribution">
            Satellite © Esri. Labels © OpenStreetMap contributors, © CARTO.
          </div>
        </motion.div>

        <div className="side-panel" data-testid="side-panel">
          <Controls
            range={range}
            onRangeChange={handleRangeChange}
            heat={heat}
            onHeatChange={handleHeatChange}
            reduceMotion={reduceMotion}
            onReduceMotion={setReduceMotion}
          />
          <Timeline grouped={grouped} onSelect={handleSelectPlace} selectedId={selectedPlace?.id} reduceMotion={reduceMotion} />
        </div>
      </div>

      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Loading visits…
          </motion.div>
        )}
      </AnimatePresence>

      <BottomSheet
        pendingPlace={pendingPlace}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        onUpdate={(next) => setPendingPlace((prev) => ({ ...prev, ...next }))}
        reduceMotion={reduceMotion}
      />
    </div>
  );
}
