export const worldPolygon = [
  [
    [-180, -85],
    [180, -85],
    [180, 85],
    [-180, 85],
    [-180, -85],
  ],
];

export function createMask(ukrainePolygon) {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [worldPolygon[0], ukrainePolygon[0]],
    },
  };
}

export function getBounds(ukrainePolygon) {
  const coords = ukrainePolygon[0];
  let minLng = 180;
  let minLat = 90;
  let maxLng = -180;
  let maxLat = -90;
  coords.forEach(([lng, lat]) => {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  });
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

export function isWithinBounds(lngLat, bounds) {
  const [[minLng, minLat], [maxLng, maxLat]] = bounds;
  return (
    lngLat.lng >= minLng &&
    lngLat.lng <= maxLng &&
    lngLat.lat >= minLat &&
    lngLat.lat <= maxLat
  );
}

export function pointInPolygon(lngLat, polygon) {
  const [lng, lat] = lngLat;
  const coords = polygon[0];
  let inside = false;
  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const [xi, yi] = coords[i];
    const [xj, yj] = coords[j];
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
