NIÑOS RANCIOS — MERCADO PAGO (V120)

Integración: Checkout Pro mediante Orders API.

Variables en server/.env:
MERCADOPAGO_ACCESS_TOKEN=TEST-...
MERCADOPAGO_WEBHOOK_SECRET=...
PUBLIC_BASE_URL=https://tu-url-publica-https

Pruebas locales:
1. Ejecuta npm start en server.
2. En otra consola crea un túnel HTTPS a http://localhost:4242.
3. Coloca la URL del túnel en PUBLIC_BASE_URL y reinicia npm start.
4. En Mercado Pago > Tus integraciones > tu aplicación > Webhooks, configura:
   https://TU-URL/api/mercadopago/webhook
5. Activa el evento/tópico Orders (Mercado Pago).
6. Copia la clave secreta del webhook a MERCADOPAGO_WEBHOOK_SECRET y reinicia el servidor.
7. Haz una compra de prueba con Mercado Pago.

La tienda valida la firma x-signature mediante HMAC-SHA256 y consulta la order directamente a la API antes de crear el pedido o descontar inventario.
