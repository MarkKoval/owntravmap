import maplibregl from "maplibre-gl";
import { fetchPlaces, fetchStats } from "../api/client.js";
import { createBottomSheet } from "../ui/bottomSheet.js";
import { generateMetaballContours } from "./metaballs.js";

const UA_CENTER = [31.1656, 48.3794];
const UA_BOUNDS = [22.1, 44.1, 40.2, 52.4];

export function initMap({ container, timelinePanel, dashboardPanel, sphereModal }) {
  const map = new maplibregl.Map({
    container,
    style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    center: UA_CENTER,
    zoom: 5.5,
    maxBounds: UA_BOUNDS,
    minZoom: 5,
    maxZoom: 13
  });

  const bottomSheet = createBottomSheet(container.parentElement, async () => {
    await refreshData();
  });

  map.on("click", (event) => {
    const coords = [event.lngLat.lng, event.lngLat.lat];
    bottomSheet.open(coords);
  });

  map.on("load", async () => {
    map.addSource("places", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: []
      }
    });

    map.addLayer({
      id: "places-heat",
      type: "heatmap",
      source: "places",
      maxzoom: 12,
      paint: {
        "heatmap-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5, 20,
          10, 60
        ],
        "heatmap-intensity": 1.1,
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0, "rgba(0,0,0,0)",
          0.2, "rgba(33,130,255,0.6)",
          0.6, "rgba(143,90,255,0.7)",
          1, "rgba(255,90,184,0.9)"
        ]
      }
    });

    map.addSource("metaballs", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: []
      }
    });

    map.addLayer({
      id: "metaballs-fill",
      type: "line",
      source: "metaballs",
      paint: {
        "line-color": "rgba(148,189,255,0.9)",
        "line-width": 2
      }
    });

    await refreshData();
  });

  map.on("moveend", refreshData);

  async function refreshData() {
    const bbox = map.getBounds().toArray().flat();
    const zoom = map.getZoom();
    const { places } = await fetchPlaces({ bbox, zoom });

    const features = places.map((place) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: place.coordinates
      },
      properties: {
        id: place.id,
        visitsCount: place.visitsCount
      }
    }));

    const source = map.getSource("places");
    source.setData({
      type: "FeatureCollection",
      features
    });

    const points = places.map((place) => ({
      coordinates: place.coordinates,
      weight: Math.log(1 + place.visitsCount)
    }));

    const contours = generateMetaballContours({
      points,
      gridSize: zoom > 8 ? 0.02 : 0.05,
      threshold: 0.6,
      bounds: bbox
    });

    const contourFeatures = contours.map((segment) => ({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: segment
      },
      properties: {}
    }));

    map.getSource("metaballs").setData({
      type: "FeatureCollection",
      features: contourFeatures
    });

    const stats = await fetchStats();
    dashboardPanel.setStats({
      totalVisits: stats.totalVisits,
      regions: `0/24`,
      topCity: "Київ",
      topTag: Object.keys(stats.visitsByTag || {})[0] || "—"
    });

    const timelineItems = places.flatMap((place) =>
      (place.visits || []).map((visit) => ({
        id: place.id,
        name: place.name,
        visitedAt: visit.visitedAt,
        rating: visit.rating,
        note: visit.note
      }))
    );
    timelinePanel.setItems(timelineItems);
  }

  map.on("dblclick", (event) => {
    const clusterPhotos = [
      "/photos/sample1.jpg",
      "/photos/sample2.jpg"
    ];
    sphereModal.open(clusterPhotos);
  });

  return map;
}
