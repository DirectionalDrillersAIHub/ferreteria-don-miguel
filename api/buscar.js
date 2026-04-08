module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Falta búsqueda' });

  try {
    const url = `https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(q)}&limit=12`;
    
    const respuesta = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'es-AR,es;q=0.9',
      }
    });

    const texto = await respuesta.text();
    const datos = JSON.parse(texto);

    if (!datos || !datos.results || datos.results.length === 0) {
      return res.status(200).json({ productos: [], debug: datos });
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