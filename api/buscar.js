module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Falta busqueda' });
  try {
    const tr = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials&client_id=3657697217255500&client_secret=uKKiMkiy4EotNDuITH5RKCysOfUrT0MK'
    });
    const td = await tr.json();
    const token = td.access_token;
    const sr = await fetch('https://api.mercadolibre.com/sites/MLA/search?q=' + encodeURIComponent(q) + '&limit=12', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const datos = await sr.json();
    if (!datos.results || datos.results.length === 0) return res.status(200).json({ productos: [] });
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