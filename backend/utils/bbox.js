export function parseBBox(bbox) {
  if (!bbox) return null;
  const parts = bbox.split(',').map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return null;
  return {
    minLng: parts[0],
    minLat: parts[1],
    maxLng: parts[2],
    maxLat: parts[3]
  };
}

export function inBBox(place, bbox) {
  if (!bbox) return true;
  return (
    place.lng >= bbox.minLng &&
    place.lng <= bbox.maxLng &&
    place.lat >= bbox.minLat &&
    place.lat <= bbox.maxLat
  );
}
