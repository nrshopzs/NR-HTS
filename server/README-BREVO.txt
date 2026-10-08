Niños Rancios — Brevo SMTP (V126)

Esta versión usa Brevo para correos transaccionales.

Variables necesarias en server/.env:
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=TU_LOGIN_SMTP_DE_BREVO
BREVO_SMTP_KEY=TU_SMTP_KEY
BREVO_FROM_ORDERS=pedidos@xn--niosrancios-2db.com
BREVO_FROM_ACCOUNTS=cuentas@xn--niosrancios-2db.com
BREVO_FROM_CONTACT=contacto@xn--niosrancios-2db.com
STORE_NOTIFICATION_EMAIL=TU_CORREO_INTERNO
STORE_NAME=Niños Rancios

IMPORTANTE:
- Nunca compartas BREVO_SMTP_KEY.
- No pongas la clave en app.js ni en archivos públicos.
- El dominio con ñ se usa en Brevo en su forma Punycode: xn--niosrancios-2db.com.
- ImprovMX sigue recibiendo y reenviando las respuestas entrantes.
- V126 usa cuentas@... para verificación de correo, bienvenida, recuperación de contraseña y avisos de seguridad.
- V126 no cambia las credenciales ni la lógica de cobro de los proveedores de pago.
- Durante pruebas, PUBLIC_BASE_URL debe apuntar al túnel HTTPS activo para que los enlaces de cuenta enviados por email funcionen.

Prueba rápida:
1. npm install
2. npm start
3. Abre http://localhost:4242/api/email/config
4. Debe mostrar configured:true y storeNotificationConfigured:true.
5. Envía el formulario de Contacto y confirma que llega el aviso a la tienda y la respuesta automática al cliente.
6. Haz una compra de prueba y confirma los dos correos: cliente + tienda.
