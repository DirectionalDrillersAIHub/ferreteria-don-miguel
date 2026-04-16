const nodemailer = require('nodemailer');

// Rate limiting básico en memoria (por instancia Vercel)
const _rl = {};
const RL_MAX = 5;
const RL_WINDOW = 60 * 1000; // 1 minuto

function checkRate(ip) {
  const now = Date.now();
  if (!_rl[ip] || _rl[ip].reset < now) {
    _rl[ip] = { count: 0, reset: now + RL_WINDOW };
  }
  _rl[ip].count++;
  return _rl[ip].count <= RL_MAX;
}

// Sanitiza strings para HTML (previene XSS en el cuerpo del mail)
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .slice(0, 1000);
}

module.exports = async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Rate limiting por IP
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (!checkRate(ip)) {
    return res.status(429).json({ error: 'Demasiadas solicitudes. Intentá en 1 minuto.' });
  }

  // Validar variables de entorno
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.error('Faltan variables de entorno GMAIL_USER / GMAIL_PASS');
    return res.status(500).json({ error: 'Configuración de mail no disponible' });
  }

  const { nombre, telefono, direccion, ciudad, cp, obs, items, total, fecha } = req.body || {};

  // Validación básica
  if (!nombre || !telefono || !Array.isArray(items) || !items.length || !total) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  // Agrupar items por proveedor
  const grupos = {};
  items.forEach(function(i) {
    const prov = String(i.prov || 'Sin proveedor');
    if (!grupos[prov]) grupos[prov] = [];
    grupos[prov].push(i);
  });

  const provEmoji = { 'Distribuidora Austral': '🔵', 'Don Antonio': '🟡' };

  const itemsHtml = Object.keys(grupos).map(function(prov) {
    const emoji = provEmoji[prov] || '⚪';
    const subtotalProv = grupos[prov].reduce(function(s, i) { return s + (Number(i.subtotal) || 0); }, 0);
    const filas = grupos[prov].map(function(i) {
      const cod = i.codigo ? '[' + esc(i.codigo) + '] ' : '';
      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #2a2a3a;color:#f0ede8;font-size:14px">${cod}${esc(i.nombre)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #2a2a3a;text-align:center;color:#f0ede8;font-size:14px">${Number(i.qty) || 1}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #2a2a3a;text-align:right;color:#f0ede8;font-size:14px;white-space:nowrap">$${Number(i.subtotal || 0).toLocaleString('es-AR')}</td>
        </tr>`;
    }).join('');
    return `
      <tr style="background:#1a1a2e">
        <td colspan="3" style="padding:10px 12px;font-weight:700;color:#ff6b35;font-size:14px;letter-spacing:1px">${emoji} ${esc(prov)}</td>
      </tr>
      ${filas}
      <tr style="background:#0e0e1a">
        <td colspan="2" style="padding:6px 12px;text-align:right;color:#888;font-size:12px">Subtotal ${esc(prov)}:</td>
        <td style="padding:6px 12px;text-align:right;color:#ffd700;font-weight:700;font-size:13px;white-space:nowrap">$${subtotalProv.toLocaleString('es-AR')}</td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nuevo Pedido — Ferretería Don Miguel</title>
</head>
<body style="margin:0;padding:24px 0;background:#060608;font-family:'Segoe UI',Tahoma,sans-serif;color:#f0ede8">
<div style="max-width:620px;margin:0 auto;background:#0e0e14;border:1px solid #2a2a3a;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.6)">

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#ff4500 0%,#ff6b35 100%);padding:36px 28px;text-align:center">
    <div style="font-size:48px;margin-bottom:10px">🔧</div>
    <h1 style="margin:0;color:white;font-size:26px;font-weight:900;letter-spacing:3px;text-transform:uppercase">Nuevo Pedido</h1>
    <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px">Ferretería Don Miguel</p>
  </div>

  <!-- DATOS CLIENTE -->
  <div style="padding:28px;border-bottom:1px solid #2a2a3a">
    <h2 style="margin:0 0 18px;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#ff6b35">👤 Datos del Cliente</h2>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:7px 0;color:#888;font-size:13px;width:110px">Nombre</td><td style="padding:7px 0;font-weight:600;font-size:14px">${esc(nombre)}</td></tr>
      <tr><td style="padding:7px 0;color:#888;font-size:13px">Teléfono</td><td style="padding:7px 0;font-weight:600;font-size:14px">${esc(telefono)}</td></tr>
      <tr><td style="padding:7px 0;color:#888;font-size:13px">Dirección</td><td style="padding:7px 0;font-weight:600;font-size:14px">${esc(direccion)}${cp ? ', CP&nbsp;' + esc(cp) : ''}</td></tr>
      <tr><td style="padding:7px 0;color:#888;font-size:13px">Ciudad</td><td style="padding:7px 0;font-weight:600;font-size:14px">${esc(ciudad)}</td></tr>
      ${obs ? `<tr><td style="padding:7px 0;color:#888;font-size:13px;vertical-align:top">Obs.</td><td style="padding:7px 0;font-size:13px;color:#bbb;font-style:italic">${esc(obs)}</td></tr>` : ''}
    </table>
  </div>

  <!-- PRODUCTOS -->
  <div style="padding:28px;border-bottom:1px solid #2a2a3a">
    <h2 style="margin:0 0 18px;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#ff6b35">🛒 Productos por Proveedor</h2>
    <table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;background:#16161f">
      <thead>
        <tr style="background:#1f1f2e">
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:#888;font-weight:700;letter-spacing:1px;text-transform:uppercase">PRODUCTO</th>
          <th style="padding:10px 12px;text-align:center;font-size:11px;color:#888;font-weight:700;letter-spacing:1px;text-transform:uppercase">QTY</th>
          <th style="padding:10px 12px;text-align:right;font-size:11px;color:#888;font-weight:700;letter-spacing:1px;text-transform:uppercase">SUBTOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
  </div>

  <!-- TOTAL -->
  <div style="padding:32px 28px;text-align:center;background:#13131c">
    <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:3px;margin-bottom:10px">💵 Total del Pedido</div>
    <div style="font-size:42px;font-weight:900;color:#ff4500;letter-spacing:1px">$${esc(total)}</div>
    <div style="font-size:13px;color:#888;margin-top:12px">📅 Arribo estimado: ${esc(fecha)}</div>
  </div>

  <!-- AVISO -->
  <div style="padding:18px 28px;background:#1a0800;border-top:2px solid rgba(255,69,0,0.25);text-align:center;font-size:13px;color:#ff6b35;font-weight:600">
    ⚠️ Verificar comprobante de transferencia adjunto en WhatsApp
  </div>

  <!-- FOOTER -->
  <div style="padding:16px 28px;text-align:center;font-size:11px;color:#555;border-top:1px solid #1a1a2a">
    Ferretería Don Miguel · Sistema automático de pedidos
  </div>

</div>
</body>
</html>`;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Ferretería Don Miguel" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: `🔧 Nuevo pedido: ${esc(nombre)} — $${esc(total)}`,
      html,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error enviando email:', err.message);
    return res.status(500).json({ error: 'No se pudo enviar el email: ' + err.message });
  }
};
