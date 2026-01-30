export async function fetchPlaces({ bbox, zoom }) {
  const response = await fetch(`/api/places?bbox=${encodeURIComponent(bbox)}&zoom=${zoom}`);
  if (!response.ok) {
    throw new Error('Failed to load places');
  }
  return response.json();
}

export async function fetchStats() {
  const response = await fetch('/api/stats');
  if (!response.ok) {
    throw new Error('Failed to load stats');
  }
  return response.json();
}
