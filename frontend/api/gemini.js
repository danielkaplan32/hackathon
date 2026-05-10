// Vercel serverless function to proxy Gemini API requests securely
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured' });
  }


  // Debug: Log incoming request body
  console.log('Incoming /api/gemini request:', JSON.stringify(req.body));

  const { endpoint, body } = req.body;
  if (!endpoint || !body) {
    console.error('Missing endpoint or body:', req.body);
    return res.status(400).json({ error: 'Missing endpoint or body', received: req.body });
  }

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/${endpoint}?key=${apiKey}`;
    console.log('Proxying to Gemini endpoint:', geminiUrl);
    console.log('Gemini request body:', JSON.stringify(body));
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('Gemini API error:', response.status, data);
      // Return error details for debugging
      return res.status(response.status).json({
        error: 'Gemini API error',
        status: response.status,
        geminiResponse: data
      });
    }
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Failed to fetch from Gemini API', details: err.message });
  }
}
