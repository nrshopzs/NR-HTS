ACTUALIZACIÓN V127.42 — POSTGRESQL
----------------------------------
Este archivo conserva instrucciones históricas de versiones anteriores.
Desde V127.42, si DATA_BACKEND=postgres, pedidos/inventario/clientes/sesiones/borradores de pago/usos de promociones se guardan en PostgreSQL y los JSON correspondientes quedan solo como respaldo de migración.
Consulta ../V127.42-LEEME.txt y ../POSTGRESQL-MIGRACION-V127.42.md antes de desplegar.

NIÑOS RANCIOS — V54 PEDIDOS + STRIPE (MODO PRUEBA)

Esta versión agrega:
- generación de números de pedido aleatorios (ej. NR-48273195) después de confirmar la compra;
- almacenamiento local de pedidos del servidor en server/data/orders.json;
- inventario del servidor en server/data/inventory.json;
- descuento de inventario al confirmar el pago;
- limpieza del carrito solamente después de crear el pedido;
- página payment-success.html completamente editable y con resumen del pedido;
- endpoint de consulta de pedidos preparado para conectar después la página de búsqueda.

IMPORTANTE:
- Sigue siendo modo de prueba de Stripe.
- Tu archivo server/.env no se incluye ni debe compartirse. Copia tu .env de V53 a esta versión.
- Para pruebas locales: npm install (si hace falta) y npm start dentro de server.
- El webhook ya puede finalizar pedidos si configuras STRIPE_WEBHOOK_SECRET. Sin webhook, la página de pago exitoso finaliza el pedido al regresar de Stripe.
