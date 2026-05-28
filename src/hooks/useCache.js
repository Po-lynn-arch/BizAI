// Simple in-memory cache shared across all pages
const cache = {}
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function getCached(key) {
  const entry = cache[key]
  if (!entry) return null
  if (Date.now() - entry.time > CACHE_TTL) {
    delete cache[key]
    return null
  }
  return entry.data
}

export function setCache(key, data) {
  cache[key] = { data, time: Date.now() }
}

export function clearCache() {
  Object.keys(cache).forEach(k => delete cache[k])
}