const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Falta busqueda' });

  const token = 'APP_USR-3657697217255500-040814-3b39b29f2885080e21209f355c15690c-95829937';

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.mercadolibre.com',
      path: '/sites/MLA/search?q=' + encodeURIComponent(q) + '&limit=12',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token,
        'User-Agent': 'curl/7.68.0'
      }
    };

    const request = https.get(options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const datos = JSON.parse(data);
          if (!datos.results || datos.results.length === 0) {
            res.status(200).json({ productos: [], debug: datos });
            resolve();
            return;
          }
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
          res.status(200).json({ productos: productos });
          resolve();
        } catch(e) {
          res.status(500).json({ error: e.message, raw: data.substring(0, 300) });
          resolve();
        }
      });
    });
    request.on('error', (e) => {
      res.status(500).json({ error: e.message });
      resolve();
    });
  });
};