module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Falta búsqueda' });

  try {
    const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: '3657697217255500',
        client_secret: 'uKKiMkiy4EotNDuITH5RKCysOfUrT0MK'
      })
    });

    const tokenData = await tokenRes.json();

    return res.status(200).json({ tokenData: toke