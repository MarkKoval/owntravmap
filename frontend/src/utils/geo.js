export function getUkrainePolygon(geojson) {
  const feature = geojson.features?.[0];
  if (!feature) return [];
  return feature.geometry.coordinates?.[0] || [];
}

export function pointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function polygonBounds(polygon) {
  return polygon.reduce(
    (bounds, [lng, lat]) => {
      const [minLng, minLat, maxLng, maxLat] = bounds;
      return [
        Math.min(minLng, lng),
        Math.min(minLat, lat),
        Math.max(maxLng, lng),
        Math.max(maxLat, lat)
      ];
    },
    [Infinity, Infinity, -Infinity, -Infinity]
  );
}

export function createMaskGeojson(ukraineGeojson) {
  const ukrainePolygon = getUkrainePolygon(ukraineGeojson);
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-180, -85],
              [180, -85],
              [180, 85],
              [-180, 85],
              [-180, -85]
            ],
            ukrainePolygon
          ]
        }
      }
    ]
  };
}
