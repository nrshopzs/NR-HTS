STRIPE — NIÑOS RANCIOS V116

La integración admite modo de prueba y modo real sin editar app.js.

CONFIGURACIÓN EN server/.env
STRIPE_SECRET_KEY=sk_test_... o sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_test_... o pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

IMPORTANTE
- La clave secreta y el secreto del webhook nunca deben colocarse en archivos públicos del frontend.
- La clave publicable sí puede llegar al navegador; V116 la obtiene preferentemente desde el servidor.
- Las claves publicable y secreta deben pertenecer al mismo entorno: ambas test o ambas live.
- Antes de publicar, configura un webhook HTTPS apuntando a /api/stripe/webhook y escucha payment_intent.succeeded.
- La página payment-success.html conserva una confirmación de respaldo consultando Stripe; el webhook sigue siendo la confirmación recomendada para producción.

PRUEBA LOCAL
1. Coloca claves de prueba en .env.
2. npm install
3. npm start
4. Abre http://localhost:4242

PRODUCCIÓN
1. Coloca las claves live en las variables de entorno del servidor.
2. Configura STRIPE_WEBHOOK_SECRET con el secreto del endpoint de producción.
3. Usa HTTPS.
4. Realiza una compra real controlada y verifica pedido, inventario y Stripe Dashboard.
