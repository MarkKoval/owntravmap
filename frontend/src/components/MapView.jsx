import { useEffect, useMemo, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { createMask, getBounds, pointInPolygon } from "../utils/geo.js";

const HEAT_LAYER_ID = "places-heat";
const POINT_LAYER_ID = "places-point";
const CLUSTER_LAYER_ID = "places-cluster";
const CLUSTER_COUNT_ID = "places-cluster-count";

export default function MapView({
  places,
  tempPlace,
  heatConfig,
  onMapClick,
  onMapLoaded,
  focusPlace,
  reduceMotion,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const ukraineRef = useRef(null);

  const mapStyle = useMemo(
    () => ({
      version: 8,
      sources: {
        satellite: {
          type: "raster",
          tiles: [
            "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution: "Imagery © Esri",
        },
        labels: {
          type: "raster",
          tiles: [
            "https://cartodb-basemaps-a.global.ssl.fastly.net/light_only_labels/{z}/{x}/{y}.png",
          ],
          tileSize: 256,
          attribution: "© OpenStreetMap contributors, © CARTO",
        },
      },
      layers: [
        { id: "satellite", type: "raster", source: "satellite" },
        {
          id: "labels",
          type: "raster",
          source: "labels",
          paint: { "raster-opacity": 0.85 },
        },
      ],
    }),
    []
  );

  useEffect(() => {
    let isMounted = true;
    async function setupMap() {
      const response = await fetch("/ukraine.geojson");
      const ukraineGeo = await response.json();
      const ukrainePolygon = ukraineGeo.features[0].geometry.coordinates;
      const bounds = getBounds(ukrainePolygon);
      if (!isMounted) return;
      ukraineRef.current = { geo: ukraineGeo, polygon: ukrainePolygon, bounds };

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: mapStyle,
        center: [31.1656, 48.3794],
        zoom: 5.2,
        renderWorldCopies: false,
        maxBounds: [
          [bounds[0][0] - 2, bounds[0][1] - 2],
          [bounds[1][0] + 2, bounds[1][1] + 2],
        ],
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }));

      map.on("load", () => {
        const mask = createMask(ukrainePolygon);
        map.addSource("ukraine", { type: "geojson", data: ukraineGeo });
        map.addSource("ukraine-mask", { type: "geojson", data: mask });
        map.addSource("places", {
          type: "geojson",
          data: geojsonFromPlaces(places),
          cluster: true,
          clusterRadius: 60,
        });
        map.addSource("temp-place", {
          type: "geojson",
          data: geojsonFromPlaces(tempPlace ? [tempPlace] : []),
        });

        map.addLayer({
          id: "ukraine-outline",
          type: "line",
          source: "ukraine",
          paint: { "line-color": "rgba(240,240,250,0.6)", "line-width": 1.2 },
        });

        map.addLayer({
          id: "ukraine-mask-layer",
          type: "fill",
          source: "ukraine-mask",
          paint: { "fill-color": "rgba(7,9,16,0.72)" },
        });

        map.addLayer({
          id: HEAT_LAYER_ID,
          type: "heatmap",
          source: "places",
          maxzoom: 12,
          paint: {
            "heatmap-radius": heatConfig.radius,
            "heatmap-intensity": heatConfig.intensity,
            "heatmap-opacity": 0.7,
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(34,59,125,0)",
              0.3,
              "rgba(77,113,199,0.5)",
              0.6,
              "rgba(118,224,255,0.7)",
              1,
              "rgba(245,206,255,0.9)",
            ],
          },
        });

        map.addLayer({
          id: CLUSTER_LAYER_ID,
          type: "circle",
          source: "places",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "rgba(98,173,255,0.6)",
            "circle-radius": ["step", ["get", "point_count"], 18, 20, 24, 50, 32],
            "circle-opacity": 0.8,
          },
        });

        map.addLayer({
          id: CLUSTER_COUNT_ID,
          type: "symbol",
          source: "places",
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["get", "point_count_abbreviated"],
            "text-size": 12,
          },
          paint: { "text-color": "#09101f" },
        });

        map.addLayer({
          id: POINT_LAYER_ID,
          type: "circle",
          source: "places",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": "rgba(245,206,255,0.85)",
            "circle-radius": 6,
            "circle-stroke-color": "rgba(255,255,255,0.9)",
            "circle-stroke-width": 1,
          },
        });

        map.addLayer({
          id: "temp-place-layer",
          type: "circle",
          source: "temp-place",
          paint: {
            "circle-color": "rgba(255,255,255,0.9)",
            "circle-radius": 8,
            "circle-stroke-color": "rgba(132,105,255,0.9)",
            "circle-stroke-width": 2,
          },
        });

        map.fitBounds(bounds, { padding: 60, duration: reduceMotion ? 0 : 1200 });
        onMapLoaded?.(map);
      });

      map.on("click", (event) => {
        const polygon = ukraineRef.current?.polygon;
        if (!polygon) return;
        const coords = [event.lngLat.lng, event.lngLat.lat];
        const inside = pointInPolygon(coords, polygon);
        if (inside) {
          onMapClick(event.lngLat);
        }
      });

      mapRef.current = map;
    }

    setupMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [heatConfig.intensity, heatConfig.radius, mapStyle, onMapClick, onMapLoaded, reduceMotion]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const source = map.getSource("places");
    if (source) {
      source.setData(geojsonFromPlaces(places));
    }
  }, [places]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const source = map.getSource("temp-place");
    if (source) {
      source.setData(geojsonFromPlaces(tempPlace ? [tempPlace] : []));
    }
  }, [tempPlace]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    if (map.getLayer(HEAT_LAYER_ID)) {
      map.setPaintProperty(HEAT_LAYER_ID, "heatmap-radius", heatConfig.radius);
      map.setPaintProperty(HEAT_LAYER_ID, "heatmap-intensity", heatConfig.intensity);
    }
  }, [heatConfig]);

  useEffect(() => {
    if (!focusPlace || !mapRef.current) return;
    const map = mapRef.current;
    map.flyTo({
      center: [focusPlace.lng, focusPlace.lat],
      zoom: 9.5,
      speed: reduceMotion ? 1.2 : 0.8,
      curve: 1.4,
      easing: (t) => t,
    });
  }, [focusPlace, reduceMotion]);

  return <div className="map" ref={containerRef} />;
}

function geojsonFromPlaces(places) {
  return {
    type: "FeatureCollection",
    features: places.map((place) => ({
      type: "Feature",
      properties: {
        id: place.id,
        title: place.title,
      },
      geometry: {
        type: "Point",
        coordinates: [place.lng, place.lat],
      },
    })),
  };
}
