# Ferretería Don Miguel — Tienda Online

## Cómo subir a Vercel (15 minutos)

### Paso 1 — Subir el proyecto a GitHub

1. Entrá a github.com e iniciá sesión
2. Hacé click en el botón verde "New" (arriba a la izquierda)
3. Nombre del repositorio: `ferreteria-don-miguel`
4. Dejalo en "Public", hacé click en "Create repository"
5. GitHub te va a mostrar una pantalla con comandos. Abrí una terminal en tu PC,
   navegá hasta la carpeta de este proyecto y ejecutá estos comandos uno por uno:

```bash
git init
git add .
git commit -m "primer subida"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/ferreteria-don-miguel.git
git push -u origin main
```

⚠️ Reemplazá TU_USUARIO por tu nombre de usuario de GitHub


### Paso 2 — Conectar con Vercel

1. Entrá a vercel.com e iniciá sesión con GitHub
2. Hacé click en "Add New Project"
3. Vas a ver tu repositorio "ferreteria-don-miguel" — hacé click en "Import"
4. Dejá todo como está y hacé click en "Deploy"
5. Vercel te da una URL pública tipo: https://ferreteria-don-miguel.vercel.app

¡Listo! La página ya está online y el buscador funciona con MercadoLibre real.


### Paso 3 — Personalizar antes de publicar

Abrí el archivo `public/index.html` y buscá el bloque CONFIG al inicio del script:

```javascript
const CONFIG = {
  WSP_NUMERO: '5492994000000',     ← Tu número de WhatsApp (sin + ni espacios)
  CBU: '0000003100021234567891',   ← Tu CBU real
  ALIAS: 'FERRETERIA.DON.MIGUEL', ← Tu alias bancario real
  COMISION: 0.10,                  ← 10% (no tocar)
  TITULAR: 'Miguel García',       ← Tu nombre completo
  DIAS_ENTREGA: 5,                 ← Días hábiles estimados
};
```

Después de editar, volvé a ejecutar:
```bash
git add .
git commit -m "configuracion actualizada"
git push
```
Vercel detecta el cambio y actualiza la página automáticamente en 30 segundos.


### Estructura del proyecto

```
ferreteria-don-miguel/
├── api/
│   └── buscar.js        ← Función que consulta MercadoLibre (servidor)
├── public/
│   └── index.html       ← La página completa de la tienda
├── vercel.json          ← Configuración de Vercel
└── package.json         ← Info del proyecto
```


### Cómo funciona el buscador

1. El cliente escribe un producto y busca
2. La página llama a `/api/buscar?q=taladro` (tu servidor en Vercel)
3. Tu servidor le pregunta a MercadoLibre
4. MercadoLibre responde con productos y precios reales
5. Tu página suma la comisión y muestra el precio final al cliente
6. El cliente agrega al carrito, ve el CBU, paga y te manda el pedido por WhatsApp
7. Vos comprás en MercadoLibre y coordinás la entrega


### Dominio propio (opcional)

Si querés una URL como www.ferreteriadonmiguel.com.ar:
- Comprá el dominio en NIC.ar (dominios .ar) o en Donweb/NIC.com
- En Vercel → Settings → Domains → agregás tu dominio
- Seguís las instrucciones para apuntar el DNS


### Soporte

Ante cualquier duda, consultá la documentación de Vercel: vercel.com/docs
