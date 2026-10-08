# Seguridad de preproducción — V127.41

Esta versión cierra los problemas más urgentes detectados en la auditoría de V127.40 sin cambiar el diseño de la tienda.

## Corregido en esta fase

- La carpeta `server/` y los JSON privados ya no se sirven como contenido estático.
- Se agregaron cabeceras de seguridad mediante Helmet y se deshabilitó `X-Powered-By`.
- `req.ip` reemplaza la confianza directa en `X-Forwarded-For`, con `TRUST_PROXY_HOPS` configurable.
- Se agregaron límites de solicitudes en endpoints sensibles.
- Las reservas no pagadas de transferencia y contraentrega pueden expirar y devolver el inventario.
- Pedidos manuales repetidos por correo/teléfono se limitan para reducir abuso.
- El uso de promociones ya no se consume prematuramente en pedidos manuales no pagados.
- Se redujo el riesgo de escrituras JSON incompletas usando escritura temporal y `rename` en el módulo de pedidos/inventario.
- Se agregó bloqueo de finalización de pagos dentro del proceso para Stripe, PayPal y Mercado Pago.
- Se preparó la actualización de Express, Multer, Nodemailer y se agregó Helmet.
- `.gitignore` excluye secretos y datos privados generados.

## Variables nuevas/relevantes

```env
NODE_ENV=development
TRUST_PROXY_HOPS=0
COD_RESERVATION_HOURS=48
BANK_PROOF_REVIEW_HOURS=48
```

En producción, `TRUST_PROXY_HOPS` debe coincidir con la topología real del hosting/proxy. No copiar ciegamente un valor de otro proveedor.

## Prueba de seguridad local

Requiere Node 20 o superior:

```bash
cd server
npm install
npm run security:check
```

El smoke test verifica que el sitio siga sirviendo los archivos públicos pero rechace rutas privadas como:

- `/server/server.js`
- `/server/data/orders.json`
- `/admin.html`

También comprueba cabeceras básicas de seguridad.

## Pendiente antes de producción real

V127.41 sigue usando archivos JSON como almacenamiento. Es suficiente para continuar pruebas locales, pero no es una arquitectura segura para varias instancias en Wasmer. Antes de cobrar pagos reales se recomienda:

1. Migrar pedidos, inventario, clientes, sesiones, promociones y payment drafts a una base de datos persistente.
2. Usar transacciones y restricciones `UNIQUE` para identificadores de Stripe, PayPal y Mercado Pago.
3. Añadir idempotencia distribuida; el bloqueo actual solo funciona dentro de un proceso Node.
4. Implementar una Content Security Policy estricta después de retirar/refactorizar scripts inline y contemplar los dominios de los proveedores de pago.
5. Considerar MFA y usuarios administrativos separados.
6. Ejecutar pruebas completas de checkout/webhooks en un entorno de staging HTTPS antes de usar credenciales de producción.
