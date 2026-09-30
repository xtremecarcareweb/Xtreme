export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiUrl = process.env.VITE_API_URL;
  if (!apiUrl) return res.status(500).json({ error: 'API URL not configured' });

  try {
    const params = new URLSearchParams(req.query);
    const targetUrl = params.toString() ? `${apiUrl}?${params}` : apiUrl;

    const opts = { method: req.method, redirect: 'manual' };
    if (req.method === 'POST' && req.body) {
      opts.headers = { 'Content-Type': 'application/json' };
      // The frontend posts JSON as text/plain, so Vercel hands us a string; don't re-encode it.
      opts.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, opts);

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      return res.status(502).json({
        error: 'redirect',
        status: response.status,
        location: response.headers.get('location'),
      });
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      const text = await response.text();
      return res.status(502).json({
        error: 'upstream_html',
        status: response.status,
        redirected: response.redirected,
        url: response.url,
        preview: text.slice(0, 300),
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
