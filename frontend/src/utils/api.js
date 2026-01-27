const API_BASE = import.meta.env.VITE_API_URL || '';

export async function fetchPlaces({ from, to } = {}) {
  const params = new URLSearchParams();
  if (from) params.set('from', from.toISOString());
  if (to) params.set('to', to.toISOString());
  const url = `${API_BASE}/api/places${params.toString() ? `?${params}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch places');
  }
  return response.json();
}

export async function createPlace(place) {
  const response = await fetch(`${API_BASE}/api/places`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(place)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create place');
  }
  return response.json();
}

export async function deletePlace(id) {
  const response = await fetch(`${API_BASE}/api/places/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error('Failed to delete place');
  }
  return response.json();
}

export async function updatePlace(id, payload) {
  const response = await fetch(`${API_BASE}/api/places/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update place');
  }
  return response.json();
}

export async function searchPlaces(query) {
  const params = new URLSearchParams({ q: query });
  const response = await fetch(`${API_BASE}/api/search?${params}`);
  if (!response.ok) {
    throw new Error('Search failed');
  }
  return response.json();
}
