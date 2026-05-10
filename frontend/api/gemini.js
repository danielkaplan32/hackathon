// Vercel serverless function to proxy Gemini API requests securely
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured' });
  }

  const { endpoint, body } = req.body;
  if (!endpoint || !body) {
    return res.status(400).json({ error: 'Missing endpoint or body' });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch from Gemini API', details: err.message });
  }
}
