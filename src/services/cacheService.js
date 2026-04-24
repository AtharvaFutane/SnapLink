const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 86400; // seconds

// In-memory cache with TTL support
// Same cache-aside pattern as Redis — swap to ioredis for production at scale
const cache = new Map();

const getFromCache = async (code) => {
  try {
    const key = `url:${code}`;
    const entry = cache.get(key);
    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      cache.delete(key);
      return null;
    }

    return entry.value;
  } catch (err) {
    console.error('Cache get failed (non-fatal):', err.message);
    return null; // fail silently — fall back to DB
  }
};

const setInCache = async (code, longUrl) => {
  try {
    cache.set(`url:${code}`, {
      value: longUrl,
      expiresAt: Date.now() + CACHE_TTL * 1000,
    });
  } catch (err) {
    console.error('Cache set failed (non-fatal):', err.message);
  }
};

const deleteFromCache = async (code) => {
  try {
    cache.delete(`url:${code}`);
  } catch (err) {
    console.error('Cache delete failed (non-fatal):', err.message);
  }
};

module.exports = { getFromCache, setInCache, deleteFromCache };
