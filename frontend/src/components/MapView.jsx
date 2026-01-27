import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { createMaskGeojson, getUkrainePolygon, polygonBounds } from "../utils/geo.js";

const baseStyle = {
  version: 8,
  sources: {
    satellite: {
      type: "raster",
      tiles: [
        "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      ],
      tileSize: 256,
      attribution:
        "Imagery © Esri, Maxar, Earthstar Geographics"
    },
    labels: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors"
    }
  },
  layers: [
    {
      id: "satellite",
      type: "raster",
      source: "satellite"
    },
    {
      id: "labels",
      type: "raster",
      source: "labels",
      paint: {
        "raster-opacity": 0.85
      }
    }
  ]
};

export default function MapView({
  ukraineGeojson,
  placesGeojson,
  filteredGeojson,
  tempPoint,
  heatConfig,
  onMapClick,
  onMapReady,
  selectedPlace
}) {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const highlightMarkerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const polygon = getUkrainePolygon(ukraineGeojson);
    const [minLng, minLat, maxLng, maxLat] = polygonBounds(polygon);
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: baseStyle,
      center: [31.1656, 48.3794],
      zoom: 5,
      minZoom: 4.5,
      maxZoom: 12,
      maxBounds: [
        [minLng - 1, minLat - 1],
        [maxLng + 1, maxLat + 1]
      ],
      renderWorldCopies: false
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }));

    map.on("load", () => {
      const maskGeojson = createMaskGeojson(ukraineGeojson);
      map.addSource("ukraine-mask", { type: "geojson", data: maskGeojson });
      map.addLayer({
        id: "mask",
        type: "fill",
        source: "ukraine-mask",
        layout: {
          "fill-rule": "evenodd"
        },
        paint: {
          "fill-color": "rgba(7, 10, 18, 0.75)",
          "fill-opacity": 0.85
        }
      });

      map.addSource("places-heat", {
        type: "geojson",
        data: filteredGeojson
      });

      map.addLayer({
        id: "heatmap",
        type: "heatmap",
        source: "places-heat",
        paint: {
          "heatmap-radius": heatConfig.radius,
          "heatmap-intensity": heatConfig.intensity,
          "heatmap-opacity": 0.8,
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(0,0,0,0)",
            0.2,
            "rgba(83, 126, 255, 0.5)",
            0.4,
            "rgba(120, 183, 255, 0.6)",
            0.6,
            "rgba(160, 255, 227, 0.8)",
            1,
            "rgba(239, 250, 255, 0.95)"
          ]
        }
      });

      map.addSource("places", {
        type: "geojson",
        data: placesGeojson,
        cluster: true,
        clusterRadius: 50,
        clusterMaxZoom: 8
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "places",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "rgba(96, 142, 255, 0.65)",
          "circle-radius": [
            "step",
            ["get", "point_count"],
            18,
            25,
            22,
            50,
            30
          ],
          "circle-blur": 0.5,
          "circle-opacity": 0.9
        }
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "places",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 12
        },
        paint: {
          "text-color": "#f8fbff"
        }
      });

      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "places",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "rgba(240, 248, 255, 0.85)",
          "circle-radius": 5,
          "circle-stroke-width": 1,
          "circle-stroke-color": "rgba(98, 136, 255, 0.9)"
        }
      });

      map.addSource("temp-point", {
        type: "geojson",
        data: tempPoint || {
          type: "FeatureCollection",
          features: []
        }
      });

      map.addLayer({
        id: "temp-point",
        type: "circle",
        source: "temp-point",
        paint: {
          "circle-color": "rgba(255, 255, 255, 0.9)",
          "circle-radius": 8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "rgba(116, 214, 255, 0.9)",
          "circle-blur": 0.1
        }
      });

      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat]
        ],
        { padding: 60, duration: 1500 }
      );

      onMapReady?.(map);
    });

    map.on("click", (event) => {
      const { lng, lat } = event.lngLat;
      onMapClick?.({ lng, lat });
    });
  }, [
    ukraineGeojson,
    onMapClick,
    onMapReady,
    heatConfig.radius,
    heatConfig.intensity,
    filteredGeojson,
    placesGeojson,
    tempPoint
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource("places-heat");
    if (source) source.setData(filteredGeojson);
  }, [filteredGeojson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource("places");
    if (source) source.setData(placesGeojson);
  }, [placesGeojson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource("temp-point");
    if (source) source.setData(tempPoint || { type: "FeatureCollection", features: [] });
  }, [tempPoint]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.getLayer("heatmap")) {
      map.setPaintProperty("heatmap", "heatmap-radius", heatConfig.radius);
      map.setPaintProperty("heatmap", "heatmap-intensity", heatConfig.intensity);
    }
  }, [heatConfig]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (highlightMarkerRef.current) {
      highlightMarkerRef.current.remove();
      highlightMarkerRef.current = null;
    }
    if (selectedPlace) {
      const el = document.createElement("div");
      el.className = "pulse-marker";
      highlightMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([selectedPlace.lng, selectedPlace.lat])
        .addTo(map);
    }
  }, [selectedPlace]);

  return <div ref={mapContainerRef} className="map-container" />;
}
