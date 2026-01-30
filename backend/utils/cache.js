const cache = new Map();

export function setCache(key, value, ttlMs = 5000) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}
