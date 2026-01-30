const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5179/api";

export async function fetchPlaces({ bbox, zoom }) {
  const url = new URL(`${API_BASE}/places`);
  if (bbox) url.searchParams.set("bbox", bbox.join(","));
  if (zoom) url.searchParams.set("zoom", zoom);
  const res = await fetch(url);
  return res.json();
}

export async function addPlace(payload) {
  const res = await fetch(`${API_BASE}/places`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function addVisit(placeId, payload) {
  const res = await fetch(`${API_BASE}/places/${placeId}/visits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function geocode(query) {
  const url = new URL(`${API_BASE}/geocode`);
  url.searchParams.set("q", query);
  const res = await fetch(url);
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  return res.json();
}
