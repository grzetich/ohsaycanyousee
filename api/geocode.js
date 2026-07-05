// Vercel serverless function: geocode proxy for OpenStreetMap Nominatim.
// Runs server-side so it can send a valid User-Agent (Nominatim policy) and
// keeps the browser same-origin (no CSP/CORS headaches). Node 18+ has global fetch.
//
// CHANGE THIS before going live — Nominatim requires a real contact:
const CONTACT = 'you@example.com';

module.exports = async (req, res) => {
  const q = (req.query && req.query.q ? String(req.query.q) : '').trim();
  if (!q) { res.status(400).json({ error: 'missing q' }); return; }

  const url = 'https://nominatim.openstreetmap.org/search'
    + '?format=jsonv2&limit=1&countrycodes=us&q=' + encodeURIComponent(q);

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'fw-fireworks-viewer/1.0 (' + CONTACT + ')',
        'Accept': 'application/json'
      }
    });
    if (!upstream.ok) { res.status(502).json({ error: 'upstream ' + upstream.status }); return; }
    const data = await upstream.json();
    // Cache identical lookups at the edge for a day to stay well under rate limits.
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: 'geocode failed' });
  }
};
