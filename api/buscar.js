module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Falta búsqueda' });

  try {
    // Obtener access token con credenciales de la app
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
    const token = tokenData.access_token;

   if (!token) {
      return res.status(500).json({ error: 'No se pudo obtener token', detalle: tokenData });
    }

    // DEBUG TEMPORAL — borrar después
    return res.status(200).json({ token_ok: true, token_type: tokenData.token_type, scope: tokenData.scope });
    }

    // Buscar en MercadoLibre con el token
    const searchRes = await fetch(
      `https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(q)}&limit=12`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    const datos = await searchRes.json();

    if (!datos.results || datos.results.length === 0) {
      return res.status(200).json({ productos: [] });
    }

    const productos = datos.results.map(item => ({
      id: item.id,
      nombre: item.title,
      precio: item.price,
      imagen: (item.thumbnail || '').replace('http://', 'https://'),
      link: item.permalink,
      envio_gratis: item.shipping?.free_shipping || false,
    }));

    return res.status(200).json({ productos });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}