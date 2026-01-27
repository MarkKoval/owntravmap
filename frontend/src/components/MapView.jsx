import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { motionTokens } from '../utils/motion.js';
import { buildUkraineMask, getBounds, loadUkraineGeojson, toGeoJson } from '../utils/geo.js';

const SATELLITE_URL = 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const LABELS_URL = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_labels/{z}/{x}/{y}.png';

export default function MapView({
  places,
  tempPlace,
  onMapClick,
  heatRadius,
  heatIntensity,
  onMapReady,
  onSelectPlace,
  selectedPlaceId,
  reduceMotion
}) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [ukraineFeature, setUkraineFeature] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const cameraQueue = useRef(Promise.resolve());

  useEffect(() => {
    let isMounted = true;
    loadUkraineGeojson().then((geojson) => {
      if (isMounted) {
        setUkraineFeature(geojson.features[0]);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current || !ukraineFeature) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: 'raster',
            tiles: [SATELLITE_URL],
            tileSize: 256,
            attribution: 'Tiles © Esri'
          },
          labels: {
            type: 'raster',
            tiles: [LABELS_URL],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors, © Stadia Maps'
          }
        },
        layers: [
          {
            id: 'satellite',
            type: 'raster',
            source: 'satellite'
          },
          {
            id: 'labels',
            type: 'raster',
            source: 'labels'
          }
        ]
      },
      center: [31.1656, 48.3794],
      zoom: 5.2,
      minZoom: 4.5,
      maxZoom: 12,
      renderWorldCopies: false
    });

    map.addControl(new maplibregl.NavigationControl({ showZoom: true }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }));

    mapRef.current = map;

    map.on('load', () => {
      const bounds = getBounds(ukraineFeature);
      map.fitBounds(bounds, { padding: 80, duration: reduceMotion ? 0 : 1400 });
      map.setMaxBounds([
        [bounds[0][0] - 2, bounds[0][1] - 2],
        [bounds[1][0] + 2, bounds[1][1] + 2]
      ]);

      map.addSource('mask', {
        type: 'geojson',
        data: buildUkraineMask(ukraineFeature)
      });
      map.addLayer({
        id: 'ukraine-mask',
        type: 'fill',
        source: 'mask',
        paint: {
          'fill-color': '#0b0f16',
          'fill-opacity': 0.72
        }
      });

      map.addSource('places', {
        type: 'geojson',
        data: toGeoJson(places),
        cluster: true,
        clusterMaxZoom: 8,
        clusterRadius: 40
      });

      map.addLayer({
        id: 'heatmap',
        type: 'heatmap',
        source: 'places',
        paint: {
          'heatmap-radius': heatRadius,
          'heatmap-intensity': heatIntensity,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(59,130,246,0)',
            0.3,
            'rgba(59,130,246,0.4)',
            0.6,
            'rgba(14,165,233,0.6)',
            1,
            'rgba(14,116,144,0.9)'
          ]
        }
      });

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'places',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': 'rgba(34,197,94,0.9)',
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            16,
            10,
            22,
            30,
            30
          ],
          'circle-opacity': 0.85
        }
      });

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'places',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold'],
          'text-size': 12
        },
        paint: {
          'text-color': '#0b0f16'
        }
      });

      map.addLayer({
        id: 'points',
        type: 'circle',
        source: 'places',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#38bdf8',
          'circle-radius': 6,
          'circle-opacity': 0.9,
          'circle-stroke-color': '#0f172a',
          'circle-stroke-width': 1
        }
      });

      map.addSource('temp-place', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
      map.addLayer({
        id: 'temp-place',
        type: 'circle',
        source: 'temp-place',
        paint: {
          'circle-color': '#f97316',
          'circle-radius': 10,
          'circle-opacity': 0.95,
          'circle-stroke-color': '#fff7ed',
          'circle-stroke-width': 2
        }
      });

      map.addSource('selected-place', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
      map.addLayer({
        id: 'selected-ring',
        type: 'circle',
        source: 'selected-place',
        paint: {
          'circle-color': 'rgba(56,189,248,0.1)',
          'circle-radius': 18,
          'circle-stroke-color': '#38bdf8',
          'circle-stroke-width': 2,
          'circle-opacity': 0.8
        }
      });

      onMapReady?.(map, queueFlyTo);
      setMapLoaded(true);
    });

    map.on('click', (event) => {
      onMapClick?.(event.lngLat);
    });

    map.on('click', 'points', (event) => {
      const feature = event.features?.[0];
      if (!feature) return;
      const id = feature.properties?.id;
      if (id) {
        onSelectPlace?.(id);
      }
    });

    map.on('mouseenter', 'points', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'points', () => {
      map.getCanvas().style.cursor = '';
    });

    return () => {
      map.remove();
      setMapLoaded(false);
    };
  }, [ukraineFeature, onMapClick, onMapReady, onSelectPlace, places, heatRadius, heatIntensity, reduceMotion]);

  const queueFlyTo = (target) => {
    cameraQueue.current = cameraQueue.current.then(
      () =>
        new Promise((resolve) => {
          if (!mapRef.current) {
            resolve();
            return;
          }
          mapRef.current.flyTo({
            ...target,
            duration: reduceMotion ? 0 : target.duration || 1600,
            easing: (t) => {
              const [p0, p1, p2, p3] = motionTokens.easing;
              return cubicBezier(p0, p1, p2, p3, t);
            }
          });
          mapRef.current.once('moveend', resolve);
        })
    );
  };

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource('places');
    if (source) {
      source.setData(toGeoJson(places));
    }
  }, [places, mapLoaded]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource('temp-place');
    if (source) {
      const data = tempPlace
        ? {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Point',
                  coordinates: [tempPlace.lng, tempPlace.lat]
                }
              }
            ]
          }
        : { type: 'FeatureCollection', features: [] };
      source.setData(data);
    }
  }, [tempPlace, mapLoaded]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    mapRef.current.setPaintProperty('heatmap', 'heatmap-radius', heatRadius);
    mapRef.current.setPaintProperty('heatmap', 'heatmap-intensity', heatIntensity);
  }, [heatRadius, heatIntensity, mapLoaded]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource('selected-place');
    if (source) {
      const target = places.find((place) => place.id === selectedPlaceId);
      const data = target
        ? {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Point',
                  coordinates: [target.lng, target.lat]
                }
              }
            ]
          }
        : { type: 'FeatureCollection', features: [] };
      source.setData(data);
    }
  }, [selectedPlaceId, places, mapLoaded]);

  return <div className="map" ref={mapContainer} data-testid="map" />;
}

function cubicBezier(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t;
}
