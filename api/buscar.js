module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Falta búsqueda' });

  try {
    const url = `https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(q)}&limit=12`;
    const respuesta = await fetch(url);
    const datos = await respuesta.json();

    const productos = datos.results.map(item => ({
      id: item.id,
      nombre: item.title,
      precio: item.price,
      imagen: item.thumbnail.replace('http://', 'https://'),
      link: item.permalink,
      envio_gratis: item.shipping?.free_shipping || false,
    }));

    return res.status(200).json({ productos });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}