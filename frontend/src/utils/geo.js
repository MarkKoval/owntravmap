import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

export async function loadUkraineGeojson() {
  const response = await fetch('/assets/ukraine.geojson');
  if (!response.ok) {
    throw new Error('Failed to load Ukraine geometry');
  }
  return response.json();
}

export function getBounds(feature) {
  const coords = feature.geometry.coordinates[0];
  const lons = coords.map((coord) => coord[0]);
  const lats = coords.map((coord) => coord[1]);
  return [
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)]
  ];
}

export function isInUkraine(feature, lng, lat) {
  return booleanPointInPolygon([lng, lat], feature);
}

export function toGeoJson(points) {
  return {
    type: 'FeatureCollection',
    features: points.map((place) => ({
      type: 'Feature',
      properties: {
        id: place.id,
        title: place.title,
        count: 1,
        color: place.color,
        category: place.category,
        visitDate: place.visitDate,
        photos: place.photos,
        createdAt: place.createdAt
      },
      geometry: {
        type: 'Point',
        coordinates: [place.lng, place.lat]
      }
    }))
  };
}
