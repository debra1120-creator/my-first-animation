module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Method Not Allowed' });
  }

  const gasUrl = process.env.GAS_URL;
  if (!gasUrl) {
    return res.status(500).json({ ok: false, message: 'GAS_URL is not configured' });
  }

  try {
    const body = parseBody(req.body);
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const log = String(body.log || '').trim();

    if (!name || !email || !log) {
      return res.status(400).json({ ok: false, message: 'Missing required fields: name, email, log' });
    }

    const gasRes = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, log })
    });

    const text = await gasRes.text();
    if (!gasRes.ok) {
      return res.status(502).json({ ok: false, message: 'Failed to forward to GAS', gasStatus: gasRes.status, gasBody: text });
    }

    let gasBody;
    try {
      gasBody = JSON.parse(text);
    } catch (_) {
      gasBody = { raw: text };
    }

    return res.status(200).json({ ok: true, gas: gasBody });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error && error.message ? error.message : 'Unexpected error' });
  }
};

function parseBody(body) {
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (_) {
      return {};
    }
  }
  if (typeof body === 'object') return body;
  return {};
}
