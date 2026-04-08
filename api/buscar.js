// api/buscar.js
// Esta función corre en Vercel (servidor) y consulta MercadoLibre sin problemas de CORS

export default async function handler(req, res) {
  // Permitir llamadas desde cualquier origen (tu página HTML)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Falta el parámetro de búsqueda' });
  }

  try {
    const url = `https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(q)}&limit=12`;
    const respuesta = await fetch(url);
    const datos = await respuesta.json();

    // Devolver solo lo que necesita la página (limpio y liviano)
    const productos = datos.results.map(item => ({
      id: item.id,
      nombre: item.title,
      precio: item.price,
      imagen: item.thumbnail.replace('http://', 'https://'),
      link: item.permalink,
      condicion: item.condition === 'new' ? 'Nuevo' : 'Usado',
      vendedor: item.seller?.nickname || '',
      envio_gratis: item.shipping?.free_shipping || false,
    }));

    return res.status(200).json({ productos, total: datos.paging.total });

  } catch (error) {
    return res.status(500).json({ error: 'Error al consultar MercadoLibre', detalle: error.message });
  }
}
