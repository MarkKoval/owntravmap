const API_BASE = 'http://localhost:3001/api';

export async function fetchPlaces() {
  const response = await fetch(`${API_BASE}/places`);
  if (!response.ok) {
    throw new Error('Failed to load places');
  }
  return response.json();
}

export async function createPlace(payload) {
  const response = await fetch(`${API_BASE}/places`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error('Failed to create place');
  }
  return response.json();
}
