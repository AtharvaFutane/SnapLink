const { getRow, runQuery } = require('../config/db');
const { generateCode, isValidUrl } = require('../utils/hashGenerator');
const { getFromCache, setInCache, deleteFromCache } = require('./cacheService');

// Shorten a long URL — generates code, handles collision, stores in DB
const shortenUrl = async (longUrl) => {
  if (!longUrl) throw { status: 400, message: 'URL is required' };
  if (!isValidUrl(longUrl)) throw { status: 400, message: 'Invalid URL provided' };

  let code;
  let attempts = 0;
  const MAX_ATTEMPTS = 3;

  // Collision handling: retry up to 3 times
  while (attempts < MAX_ATTEMPTS) {
    code = generateCode(6);
    const existing = getRow('SELECT id FROM urls WHERE code = ?', [code]);
    if (!existing) break; // no collision, use this code
    attempts++;
    if (attempts === MAX_ATTEMPTS) {
      throw { status: 500, message: 'Could not generate unique code, please retry' };
    }
  }

  runQuery('INSERT INTO urls (code, long_url) VALUES (?, ?)', [code, longUrl]);

  const result = getRow('SELECT code, long_url, clicks, created_at FROM urls WHERE code = ?', [code]);
  return result;
};

// Redirect — check cache first, then DB, then cache the result
const getLongUrl = async (code) => {
  // 1. Try cache
  const cached = await getFromCache(code);
  if (cached) {
    // Fire-and-forget click increment
    try { runQuery('UPDATE urls SET clicks = clicks + 1 WHERE code = ?', [code]); } catch (e) { /* non-fatal */ }
    return cached;
  }

  // 2. Cache miss — go to DB
  const row = getRow('SELECT long_url FROM urls WHERE code = ?', [code]);
  if (!row) {
    throw { status: 404, message: 'Short URL not found' };
  }

  const longUrl = row.long_url;

  // 3. Write to cache for next time
  await setInCache(code, longUrl);

  // 4. Increment click count
  try { runQuery('UPDATE urls SET clicks = clicks + 1 WHERE code = ?', [code]); } catch (e) { /* non-fatal */ }

  return longUrl;
};

// Get stats for a code
const getStats = async (code) => {
  const row = getRow('SELECT code, long_url, clicks, created_at FROM urls WHERE code = ?', [code]);
  if (!row) {
    throw { status: 404, message: 'Short URL not found' };
  }
  return row;
};

// Delete a short URL
const deleteUrl = async (code) => {
  const result = runQuery('DELETE FROM urls WHERE code = ?', [code]);
  if (result.changes === 0) {
    throw { status: 404, message: 'Short URL not found' };
  }
  await deleteFromCache(code); // always invalidate cache on delete
};

module.exports = { shortenUrl, getLongUrl, getStats, deleteUrl };
