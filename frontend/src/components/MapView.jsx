import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { motionTokens } from '../utils/motion.js';
import { getBounds, loadUkraineGeojson, toGeoJson } from '../utils/geo.js';
import { formatVisitDate } from '../utils/date.js';

const SATELLITE_URL = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';

export default function MapView({
  places,
  tempPlace,
  onMapClick,
  heatRadius,
  heatIntensity,
  onMapReady,
  onSelectPlace,
  onOblastCenterClick,
  selectedPlaceId,
  reduceMotion
}) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [ukraineFeature, setUkraineFeature] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const cameraQueue = useRef(Promise.resolve());
  const onMapClickRef = useRef(onMapClick);
  const onSelectPlaceRef = useRef(onSelectPlace);
  const onMapReadyRef = useRef(onMapReady);
  const reduceMotionRef = useRef(reduceMotion);
  const onOblastCenterClickRef = useRef(onOblastCenterClick);
  const hoverPopupRef = useRef(null);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
    onSelectPlaceRef.current = onSelectPlace;
    onMapReadyRef.current = onMapReady;
    reduceMotionRef.current = reduceMotion;
    onOblastCenterClickRef.current = onOblastCenterClick;
  }, [onMapClick, onSelectPlace, onMapReady, reduceMotion, onOblastCenterClick]);

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
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          satellite: {
            type: 'raster',
            tiles: [SATELLITE_URL],
            tileSize: 256,
            attribution: 'Map data © Google'
          }
        },
        layers: [
          {
            id: 'satellite',
            type: 'raster',
            source: 'satellite'
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
      map.fitBounds(bounds, { padding: 80, duration: reduceMotionRef.current ? 0 : 1400 });
      map.setMaxBounds([
        [bounds[0][0] - 2, bounds[0][1] - 2],
        [bounds[1][0] + 2, bounds[1][1] + 2]
      ]);

      map.addSource('ukraine-border', {
        type: 'geojson',
        data: ukraineFeature
      });
      map.addLayer({
        id: 'ukraine-border-glow',
        type: 'line',
        source: 'ukraine-border',
        paint: {
          'line-color': 'rgba(56,189,248,0.4)',
          'line-width': 6,
          'line-blur': 2
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        }
      });
      map.addLayer({
        id: 'ukraine-border',
        type: 'line',
        source: 'ukraine-border',
        paint: {
          'line-color': '#38bdf8',
          'line-width': 2.5,
          'line-opacity': 0.9
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        }
      });

      map.addSource('places', {
        type: 'geojson',
        data: toGeoJson(places),
        cluster: false
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
        id: 'oblast-centers',
        type: 'circle',
        source: 'places',
        filter: ['==', ['get', 'category'], 'oblast-center'],
        maxzoom: 7,
        paint: {
          'circle-color': '#f97316',
          'circle-radius': 10,
          'circle-opacity': 0.95,
          'circle-stroke-color': '#0f172a',
          'circle-stroke-width': 2
        }
      });

      map.addLayer({
        id: 'points',
        type: 'circle',
        source: 'places',
        filter: ['!=', ['get', 'category'], 'oblast-center'],
        minzoom: 7,
        paint: {
          'circle-color': ['coalesce', ['get', 'color'], '#38bdf8'],
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
          'circle-color': ['coalesce', ['get', 'color'], '#f97316'],
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
          'circle-stroke-color': ['coalesce', ['get', 'color'], '#38bdf8'],
          'circle-stroke-width': 2,
          'circle-opacity': 0.8
        }
      });

      onMapReadyRef.current?.(map, queueFlyTo);
      setMapLoaded(true);
    });

    map.on('click', (event) => {
      if (!isPrimaryMapInteraction(event)) return;
      onMapClickRef.current?.(event.lngLat);
    });

    map.on('click', 'points', (event) => {
      event.preventDefault();
      event.originalEvent?.stopPropagation?.();
      const feature = event.features?.[0];
      if (!feature) return;
      const id = feature.properties?.id;
      if (id) {
        onSelectPlaceRef.current?.(id);
      }
    });

    map.on('click', 'oblast-centers', (event) => {
      event.preventDefault();
      event.originalEvent?.stopPropagation?.();
      const feature = event.features?.[0];
      if (!feature) return;
      const id = feature.properties?.id;
      if (id) {
        onOblastCenterClickRef.current?.(id);
      }
    });

    const showPopup = (event) => {
      map.getCanvas().style.cursor = 'pointer';
      const feature = event.features?.[0];
      if (!feature) return;
      const title = feature.properties?.title || 'Без назви';
      const dateLabel = formatVisitDate(feature.properties?.visitDate, feature.properties?.createdAt);
      const html = `<div class="map-tooltip"><strong>${title}</strong><div>${dateLabel}</div></div>`;
      if (!hoverPopupRef.current) {
        hoverPopupRef.current = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 10
        });
      }
      hoverPopupRef.current.setLngLat(event.lngLat).setHTML(html).addTo(map);
    };

    const hidePopup = () => {
      map.getCanvas().style.cursor = '';
      hoverPopupRef.current?.remove();
    };

    map.on('mouseenter', 'points', showPopup);
    map.on('mouseleave', 'points', hidePopup);
    map.on('mouseenter', 'oblast-centers', showPopup);
    map.on('mouseleave', 'oblast-centers', hidePopup);

    return () => {
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, [ukraineFeature]);

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
            duration: reduceMotionRef.current ? 0 : target.duration || 1600,
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
    if (!mapRef.current || !mapLoaded || !mapRef.current.isStyleLoaded?.()) return;
    const source = mapRef.current.getSource('places');
    if (source) {
      source.setData(toGeoJson(places));
    }
  }, [places, mapLoaded]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !mapRef.current.isStyleLoaded?.()) return;
    const source = mapRef.current.getSource('temp-place');
    if (source) {
      const data = tempPlace
        ? {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: { color: tempPlace.color },
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
    if (!mapRef.current || !mapLoaded || !mapRef.current.isStyleLoaded?.()) return;
    mapRef.current.setPaintProperty('heatmap', 'heatmap-radius', heatRadius);
    mapRef.current.setPaintProperty('heatmap', 'heatmap-intensity', heatIntensity);
  }, [heatRadius, heatIntensity, mapLoaded]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !mapRef.current.isStyleLoaded?.()) return;
    const source = mapRef.current.getSource('selected-place');
    if (source) {
      const target = places.find((place) => place.id === selectedPlaceId);
      const data = target
        ? {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: { color: target.color },
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

function isPrimaryMapInteraction(event) {
  const original = event.originalEvent;
  if (!original) return true;
  if (typeof TouchEvent !== 'undefined' && original instanceof TouchEvent) return true;
  if (typeof PointerEvent !== 'undefined' && original instanceof PointerEvent) {
    return original.button === 0 || original.pointerType === 'touch';
  }
  if (typeof MouseEvent !== 'undefined' && original instanceof MouseEvent) {
    return original.button === 0;
  }
  if (typeof original.button === 'number') {
    return original.button === 0;
  }
  return true;
}
