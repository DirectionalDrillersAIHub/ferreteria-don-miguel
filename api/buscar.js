module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Falta busqueda' });
  try {
    const sr = await fetch('https://api.mercadolibre.com/sites/MLA/search?q=' + encodeURIComponent(q) + '&limit=12&access_token=APP_USR-3657697217255500-040813-747ab14be1ebd00e768057190c781ff6-95829937');
    const datos = await sr.json();
    if (!datos.results || datos.results.length === 0) return res.status(200).json({ productos: [], debug: datos });
    const productos = datos.results.map(function(item) {
      return {
        id: item.id,
        nombre: item.title,
        precio: item.price,
        imagen: (item.thumbnail || '').replace('http://', 'https://'),
        link: item.permalink,
        envio_gratis: item.shipping ? item.shipping.free_shipping : false
      };
    });
    return res.status(200).json({ productos: productos });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};